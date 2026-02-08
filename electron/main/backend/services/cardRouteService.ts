// 卡片路由服务类，负责卡片相关的路由管理
import { routeService } from './routeService';
import { db } from '../db/database';
import { getCurrentLocalTimeForSqlite } from '../utils/dateUtils';
import type { Card } from '../models';
import { ErrorHandler } from '../utils/errorUtils';

// 卡片路由服务类
export class CardRouteService {
  /**
   * 处理路由创建
   */
  handleRouteCreation(card: Card, data: any): void {
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
  handleRouteUpdate(card: Card, oldCard: Card, data: any): void {
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
  findExistingProjectRoute(projectName: string): any {
    const allRoutes = routeService.getAll();
    return allRoutes.find(route => route.path === `/${projectName}`);
  }

  /**
   * 更新卡片的路由ID
   */
  updateCardRouteId(card: Card, route: any): void {
    const updateSql = `
      UPDATE cards
      SET route_id = ?, route_path = ?
      WHERE id = ?
    `;
    db.run(updateSql, [route.id, route.path, card.id]);
  }

  /**
   * 更新根路由信息
   */
  updateRootRouteInfo(route: any, data: any): void {
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
  createSubRoutes(parentRoute: any, menuItems: any[], projectName: string, cardId: number): void {
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
  updateExistingSubRoute(route: any, menuItem: any): void {
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
  createNewSubRoute(parentRoute: any, menuItem: any, projectName: string, routeName: string, cardId: number): void {
    const subRouteData = {
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
  deleteOldRoutes(oldRoutePath: string): void {
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
  createOrUpdateRoutes(card: Card, data: any, routePath: string): void {
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
  updateSubRoutes(parentRoute: any, menuItems: any[], projectName: string, cardId: number): void {
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
  deleteCardRoutes(card: Card): void {
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
  validateRoutePath(path: string): void {
    if (!path.startsWith('/')) {
      throw ErrorHandler.createValidationError(`Menu item route path must start with /: ${path}`);
    }
  }

  /**
   * 提取路由名称
   */
  extractRouteName(path: string): string {
    const pathParts = path.split('/').filter(Boolean);
    return pathParts[pathParts.length - 1] || 'home';
  }

  /**
   * 删除未使用的子路由（按路径）
   */
  deleteUnusedSubRoutes(routesMap: Map<string, any>): void {
    for (const [path, route] of routesMap) {
      routeService.delete(route.id);
    }
  }

  /**
   * 删除未使用的子路由（按ID）
   */
  deleteUnusedSubRoutesById(routesMap: Map<number, any>): void {
    for (const [id, route] of routesMap) {
      routeService.delete(id);
    }
  }
}

// 导出单例实例
export const cardRouteService = new CardRouteService();
