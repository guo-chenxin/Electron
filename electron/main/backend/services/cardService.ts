// 卡片服务类
import { db } from '../db/database';
import { Card, CreateCardRequest, UpdateCardRequest, CreateRouteRequest, MenuItem } from '../models';
import { BaseService } from './baseService';
import { routeService } from './routeService';
import { convertUtcToLocal, getCurrentLocalTimeForSqlite } from '../utils/dateUtils';

// 卡片服务类
export class CardService extends BaseService<Card, CreateCardRequest, UpdateCardRequest> {
  protected tableName = 'cards';
  protected idField = 'id';

  /**
   * 将数据库字段映射为Card对象（处理下划线命名到驼峰命名的转换）
   * @param row 数据库查询结果行
   * @returns 映射后的Card对象
   */
  protected mapFields(row: any): Card {
    const card: Card = {
      id: row.id,
      title: row.title,
      description: row.description,
      icon: row.icon,

      routeId: row.route_id,
      routePath: row.route_path,
      lastClickedAt: convertUtcToLocal(row.last_clicked_at),
      createdAt: convertUtcToLocal(row.created_at),
      updatedAt: convertUtcToLocal(row.updated_at),
      // 初始化菜单项数组
      menuItems: []
    };

    // 如果卡片有路由ID，获取对应的根路由信息和菜单项（子路由）
    if (row.route_id) {
      // 获取根路由信息
      const rootRoute = routeService.getById(row.route_id);
      if (rootRoute) {
        // 添加根路由的附加信息
        card.redirect = rootRoute.redirect;
        card.requiresAuth = rootRoute.requiresAuth;
        card.showInMenu = rootRoute.showInMenu;
        card.showInTabs = rootRoute.showInTabs;
        card.order = rootRoute.order;
      }
      
      // 获取子路由作为菜单项
      const childRoutes = routeService.getAll().filter(route => route.parentId === row.route_id);
      card.menuItems = childRoutes.map(route => ({
        id: route.id,
        title: route.title || '',
        icon: route.icon || '',
        routePath: route.path || '',
        component: route.component || '',
        requiresAuth: route.requiresAuth,
        showInMenu: route.showInMenu,
        showInTabs: route.showInTabs,
        order: route.order
      }));
    }

    return card;
  }

  /**
   * 验证卡片数据
   */
  private validateCardData(data: any): void {
    if (!data.title) {
      throw new Error('Title is required');
    }
    
    if (data.routePath && !data.routePath.startsWith('/')) {
      throw new Error('Route path must start with /');
    }
  }

  /**
   * 保存卡片记录
   */
  private saveCardRecord(data: any): Card | null {
    const sql = `
      INSERT INTO ${this.tableName} (title, description, icon, route_id, route_path)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    // 准备参数，处理可选字段
    const params = [
      data.title, // 必填字段，不能为空
      data.description || null, // 可选字段，为空时使用null
      data.icon || null, // 可选字段，为空时使用null
      null, // route_id，稍后设置
      data.routePath || null // 可选字段，为空时使用null
    ];
    
    try {
      const result = db.run(sql, params);
      return this.getById(result.lastID);
    } catch (error: any) {
      console.error('Failed to save card record:', error.message);
      throw error;
    }
  }

  /**
   * 更新卡片记录
   */
  private updateCardRecord(cardId: number, data: any): Card | null {
    const sql = `
      UPDATE ${this.tableName}
      SET 
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        icon = COALESCE(?, icon),
        route_id = COALESCE(?, route_id),
        route_path = COALESCE(?, route_path),
        updated_at = ?
      WHERE ${this.idField} = ?
    `;
    
    try {
      db.run(sql, [
        data.title,
        data.description,
        data.icon,

        (data as UpdateCardRequest).routeId,
        data.routePath,
        getCurrentLocalTimeForSqlite(),
        cardId
      ]);
      return this.getById(cardId);
    } catch (error: any) {
      console.error('Failed to update card record:', error.message);
      throw error;
    }
  }

  /**
   * 处理路由创建
   */
  private handleRouteCreation(card: Card, data: any): void {
    if (!card.routePath) return;
    
    // 提取项目名称
    const pathParts = card.routePath.split('/').filter(Boolean);
    if (pathParts.length === 0) return;
    
    const projectName = pathParts[0];
    
    // 检查项目根路由是否已经存在
    const existingProjectRoute = this.findExistingProjectRoute(projectName);
    
    // 只有当项目根路由不存在时才创建
    if (!existingProjectRoute) {
      // 创建项目路由结构
      routeService.createProjectRoutes(projectName, card.id);
    }
      
    // 获取项目根路由
    const projectRoute = this.findExistingProjectRoute(projectName);
    
    // 更新卡片的路由ID和根路由信息
    if (projectRoute) {
      this.updateCardRouteId(card, projectRoute);
      this.updateRootRouteInfo(projectRoute, data);
      
      // 处理菜单项
      if (data.menuItems) {
        this.createSubRoutes(projectRoute, data.menuItems, projectName, card.id);
      }
    }
  }

  /**
   * 处理路由更新
   */
  private handleRouteUpdate(card: Card, oldCard: Card, data: any): void {
    const oldRoutePath = oldCard.routePath;
    const newRoutePath = card.routePath;
    
    // 检查是否需要更新路由结构
    const needsRouteUpdate = 
      oldRoutePath !== newRoutePath || 
      (data.menuItems && data.menuItems.length > 0);
    
    // 只有当需要更新路由结构时，才执行路由更新逻辑
    if (needsRouteUpdate) {
      // 如果路由路径发生变化，删除旧路由
      if (oldRoutePath && oldRoutePath !== newRoutePath) {
        this.deleteOldRoutes(oldRoutePath);
      }
      
      // 如果新卡片有路由路径，创建或更新路由记录
      if (newRoutePath) {
        this.createOrUpdateRoutes(card, data, newRoutePath);
      }
    }
  }

  /**
   * 查找现有项目路由
   */
  private findExistingProjectRoute(projectName: string): any {
    const allRoutes = routeService.getAll();
    return allRoutes.find(route => route.path === `/${projectName}`);
  }

  /**
   * 更新卡片的路由ID
   */
  private updateCardRouteId(card: Card, route: any): void {
    const updateSql = `
      UPDATE ${this.tableName}
      SET route_id = ?, route_path = ?
      WHERE id = ?
    `;
    db.run(updateSql, [route.id, route.path, card.id]);
  }

  /**
   * 更新根路由信息
   */
  private updateRootRouteInfo(route: any, data: any): void {
    routeService.update(route.id, {
      title: data.title,
      icon: data.icon || 'i-carbon-folder',
      redirect: data.redirect,
      requiresAuth: data.requiresAuth !== undefined ? data.requiresAuth : false,
      showInMenu: data.showInMenu !== undefined ? data.showInMenu : true,
      showInTabs: data.showInTabs !== undefined ? data.showInTabs : true,
      order: data.order
    });
  }

  /**
   * 创建子路由
   */
  private createSubRoutes(parentRoute: any, menuItems: any[], projectName: string, cardId: number): void {
    // 获取现有的子路由
    const existingSubRoutes = routeService.getAll().filter(route => route.parentId === parentRoute.id);
    const existingRoutesMap = new Map(existingSubRoutes.map(route => [route.path, route]));
    
    // 处理菜单项路由
    for (const menuItem of menuItems) {
      // 验证菜单项路由路径格式
      this.validateRoutePath(menuItem.routePath);
      
      // 从路由路径中提取name，确保name字段只包含英文、数字和下划线
      const routeName = this.extractRouteName(menuItem.routePath);
      
      // 检查路由是否已存在
      const existingRoute = existingRoutesMap.get(menuItem.routePath);
      
      if (existingRoute) {
        // 更新现有路由
        this.updateExistingSubRoute(existingRoute, menuItem);
        existingRoutesMap.delete(menuItem.routePath);
      } else {
        // 创建新路由
        this.createNewSubRoute(parentRoute, menuItem, projectName, routeName, cardId);
      }
    }
    
    // 删除不再需要的子路由
    this.deleteUnusedSubRoutes(existingRoutesMap);
  }

  /**
   * 更新现有子路由
   */
  private updateExistingSubRoute(route: any, menuItem: any): void {
    routeService.update(route.id, {
      title: menuItem.title,
      icon: menuItem.icon,
      component: menuItem.component,
      requiresAuth: menuItem.requiresAuth !== undefined ? menuItem.requiresAuth : false,
      showInMenu: menuItem.showInMenu !== undefined ? menuItem.showInMenu : true,
      showInTabs: menuItem.showInTabs !== undefined ? menuItem.showInTabs : true,
      order: menuItem.order
    });
  }

  /**
   * 创建新子路由
   */
  private createNewSubRoute(parentRoute: any, menuItem: any, projectName: string, routeName: string, cardId: number): void {
    const subRouteData: CreateRouteRequest = {
      path: menuItem.routePath,
      name: `${projectName}-${routeName}`,
      projectId: cardId.toString(),
      title: menuItem.title,
      icon: menuItem.icon,
      parentId: parentRoute.id,
      component: menuItem.component,
      requiresAuth: menuItem.requiresAuth !== undefined ? menuItem.requiresAuth : false,
      showInMenu: menuItem.showInMenu !== undefined ? menuItem.showInMenu : true,
      showInTabs: menuItem.showInTabs !== undefined ? menuItem.showInTabs : true,
      order: menuItem.order
    };
    
    routeService.create(subRouteData);
  }

  /**
   * 删除旧路由
   */
  private deleteOldRoutes(oldRoutePath: string): void {
    // 查找并删除原路由记录（包括子路由）
    const allRoutes = routeService.getAll();
    const oldMainRoute = allRoutes.find(route => route.path === oldRoutePath);
    if (oldMainRoute) {
      // 删除所有子路由
      const oldSubRoutes = allRoutes.filter(route => route.parentId === oldMainRoute.id);
      for (const subRoute of oldSubRoutes) {
        routeService.delete(subRoute.id);
      }
      // 删除主路由
      routeService.delete(oldMainRoute.id);
    }
  }

  /**
   * 创建或更新路由
   */
  private createOrUpdateRoutes(card: Card, data: any, routePath: string): void {
    // 提取项目名称
    const pathParts = routePath.split('/').filter(Boolean);
    if (pathParts.length === 0) return;
    
    const projectName = pathParts[0];
    
    // 检查项目根路由是否已经存在
    let projectRoute = this.findExistingProjectRoute(projectName);
    
    // 只有当项目根路由不存在时才创建
    if (!projectRoute) {
      routeService.createProjectRoutes(projectName, card.id);
      projectRoute = this.findExistingProjectRoute(projectName);
    }
      
    // 更新项目根路由的信息，使其与卡片信息一致
    if (projectRoute) {
      this.updateRootRouteInfo(projectRoute, data);
      this.updateCardRouteId(card, projectRoute);
      
      // 处理菜单项
      if (data.menuItems) {
        this.updateSubRoutes(projectRoute, data.menuItems, projectName, card.id);
      }
    }
  }

  /**
   * 更新子路由
   */
  private updateSubRoutes(parentRoute: any, menuItems: any[], projectName: string, cardId: number): void {
    // 获取现有的子路由
    const existingSubRoutes = routeService.getAll().filter(route => route.parentId === parentRoute.id);
    const existingRoutesMap = new Map(existingSubRoutes.map(route => [route.id, route]));
    
    // 处理菜单项路由
    for (const menuItem of menuItems) {
      // 验证菜单项路由路径格式
      this.validateRoutePath(menuItem.routePath);
      
      if (menuItem.id) {
        // 更新现有路由
        const existingRoute = existingRoutesMap.get(menuItem.id);
        if (existingRoute) {
          this.updateExistingSubRoute(existingRoute, menuItem);
          existingRoutesMap.delete(menuItem.id);
        }
      } else {
        // 创建新路由
        const routeName = this.extractRouteName(menuItem.routePath);
        this.createNewSubRoute(parentRoute, menuItem, projectName, routeName, cardId);
      }
    }
    
    // 删除不再需要的子路由
    this.deleteUnusedSubRoutesById(existingRoutesMap);
  }

  /**
   * 删除卡片的路由
   */
  private deleteCardRoutes(card: Card): void {
    if (!card.routePath) return;
    
    // 查找并删除对应的路由记录
    const allRoutes = routeService.getAll();
    const route = allRoutes.find(r => r.path === card.routePath);
    if (route) {
      routeService.delete(route.id);
    }
  }

  /**
   * 验证路由路径
   */
  private validateRoutePath(path: string): void {
    if (!path.startsWith('/')) {
      throw new Error(`Menu item route path must start with /: ${path}`);
    }
  }

  /**
   * 提取路由名称
   */
  private extractRouteName(path: string): string {
    const pathParts = path.split('/').filter(Boolean);
    return pathParts[pathParts.length - 1] || 'home';
  }

  /**
   * 删除未使用的子路由（按路径）
   */
  private deleteUnusedSubRoutes(routesMap: Map<string, any>): void {
    for (const [path, route] of routesMap) {
      routeService.delete(route.id);
    }
  }

  /**
   * 删除未使用的子路由（按ID）
   */
  private deleteUnusedSubRoutesById(routesMap: Map<number, any>): void {
    for (const [id, route] of routesMap) {
      routeService.delete(id);
    }
  }

  /**
   * 获取所有卡片
   */
  getAll(limit: number = 100, offset: number = 0): Card[] {
    const sql = `
      SELECT * 
      FROM ${this.tableName}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const rows = db.all<any>(sql, [limit, offset]);
    return rows.map(row => this.mapFields(row));
  }





  /**
   * 创建卡片
   */
  create(data: CreateCardRequest & { menuItems?: Array<{ title: string; icon: string; routePath: string; component?: string; requiresAuth?: boolean; showInMenu?: boolean; showInTabs?: boolean; order?: number }> }): Card | null {
    // 验证必填字段
    this.validateCardData(data);
    
    // 保存卡片记录
    const newCard = this.saveCardRecord(data);
    
    // 处理路由创建
    if (newCard && newCard.routePath) {
      this.handleRouteCreation(newCard, data);
    }
    
    return newCard;
  }

  /**
   * 更新卡片
   */
  update(id: number, data: UpdateCardRequest & { menuItems?: Array<{ id?: number; title: string; icon: string; routePath: string; component?: string; requiresAuth?: boolean; showInMenu?: boolean; showInTabs?: boolean; order?: number }> }): Card | null {
    // 获取原卡片信息
    const oldCard = this.getById(id);
    if (!oldCard) return null;
    
    // 更新卡片记录
    const updatedCard = this.updateCardRecord(id, data);
    
    // 处理路由更新
    if (updatedCard) {
      this.handleRouteUpdate(updatedCard, oldCard, data);
    }
    
    return updatedCard;
  }
  
  /**
   * 删除卡片
   */
  delete(id: number): boolean {
    // 获取卡片信息
    const card = this.getById(id);
    
    // 调用父类的删除方法
    const result = super.delete(id);
    
    // 如果卡片有路由路径，删除对应的路由记录
    if (result && card && card.routePath) {
      this.deleteCardRoutes(card);
    }
    
    return result;
  }
}

// 导出单例实例
export const cardService = new CardService();
