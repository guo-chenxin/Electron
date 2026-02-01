// 卡片服务类
import { db } from '../db/database';
import { Card, CreateCardRequest, UpdateCardRequest, CreateRouteRequest } from '../models';
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
      isFavorite: row.is_favorite === 1,
      type: row.type,
      routeId: row.route_id,
      routePath: row.route_path,
      lastClickedAt: convertUtcToLocal(row.last_clicked_at),
      createdAt: convertUtcToLocal(row.created_at),
      updatedAt: convertUtcToLocal(row.updated_at)
    };

    // 如果卡片有路由ID，获取对应的菜单项（子路由）
    if (row.route_id) {
      const childRoutes = routeService.getAll().filter(route => route.parentId === row.route_id);
      card.menuItems = childRoutes.map(route => ({
        title: route.title || '',
        icon: route.icon || '',
        routePath: route.path || ''
      }));
    }

    return card;
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
   * 获取收藏的卡片
   */
  getFavoriteCards(limit: number = 100, offset: number = 0): Card[] {
    const sql = `
      SELECT * 
      FROM ${this.tableName}
      WHERE is_favorite = 1
      ORDER BY updated_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const rows = db.all<any>(sql, [limit, offset]);
    return rows.map(row => this.mapFields(row));
  }



  /**
   * 获取最近访问的卡片
   */
  getRecentCards(limit: number = 100, offset: number = 0): Card[] {
    const sql = `
      SELECT * 
      FROM ${this.tableName}
      ORDER BY last_clicked_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const rows = db.all<any>(sql, [limit, offset]);
    return rows.map(row => this.mapFields(row));
  }



  /**
   * 点击卡片，更新最后访问时间
   */
  clickCard(id: number): Card | null {
    // 使用本地时间而不是UTC时间
    const localTime = getCurrentLocalTimeForSqlite();
    
    const sql = `
      UPDATE ${this.tableName}
      SET last_clicked_at = ?
      WHERE ${this.idField} = ?
    `;
    
    db.run(sql, [localTime, id]);
    return this.getById(id);
  }

  /**
   * 创建卡片
   */
  create(data: CreateCardRequest & { menuItems?: Array<{ title: string; icon: string; routePath: string }> }): Card | null {
    // 验证必填字段
    if (!data.title) {
      throw new Error('Title is required');
    }
    
    // 验证路由路径格式
    if (data.routePath && !data.routePath.startsWith('/')) {
      throw new Error('Route path must start with /');
    }
    
    const sql = `
      INSERT INTO ${this.tableName} (title, description, icon, is_favorite, type, route_id, route_path)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    // 准备参数，处理可选字段
      const params = [
        data.title, // 必填字段，不能为空
        data.description || null, // 可选字段，为空时使用null
        data.icon || null, // 可选字段，为空时使用null
        0, // 默认不是收藏状态
        data.type || 'project', // 可选字段，默认为'project'
        null, // route_id，稍后设置
        data.routePath || null // 可选字段，为空时使用null
      ];
    
    try {
      const result = db.run(sql, params);
      const newCard = this.getById(result.lastID);
      
      // 如果有路由路径，创建对应的路由记录
    if (newCard && newCard.routePath) {
      // 提取项目名称
      const pathParts = newCard.routePath.split('/').filter(Boolean);
      if (pathParts.length > 0) {
        const projectName = pathParts[0];
        // 根据卡片类型确定项目类型
        const projectType = newCard.type === 'project' ? 'regular' : 'other';
        
        // 检查项目根路由是否已经存在
        const allRoutes = routeService.getAll();
        const existingProjectRoute = allRoutes.find(route => route.path === `/${projectName}`);
        
        // 只有当项目根路由不存在时才创建
        if (!existingProjectRoute) {
          // 创建项目根路由
          const projectRoute = routeService.create({
            path: `/${projectName}`,
            name: projectName,
            projectId: projectName,
            projectType: projectType,
            title: newCard.title, // 使用卡片标题作为路由标题
            icon: newCard.icon || 'i-carbon-folder', // 使用卡片的图标，如果没有则使用默认的文件夹图标
            requiresAuth: true,
            showInMenu: newCard.type === 'project',
            showInTabs: true,
            alwaysShow: true,
            order: 999,
            redirect: `/${projectName}/home`
          });
          
          // 为所有项目创建默认的首页子路由
          routeService.create({
            path: `/${projectName}/home`,
            name: `${projectName}-home`,
            projectId: projectName,
            projectType: projectType,
            title: '首页',
            icon: 'i-carbon-home',
            requiresAuth: true,
            showInMenu: newCard.type === 'project',
            showInTabs: false,
            order: 1,
            parentId: projectRoute?.id
          });
          
          // 为常规项目额外创建设置子路由
          if (newCard.type === 'project') {
            routeService.create({
              path: `/${projectName}/settings`,
              name: `${projectName}-settings`,
              projectId: projectName,
              projectType: projectType,
              title: '设置',
              icon: 'i-carbon-settings',
              requiresAuth: true,
              showInMenu: true,
              showInTabs: false,
              order: 99,
              parentId: projectRoute?.id
            });
          }
        }
          
          // 获取项目根路由
          const projectRoute = routeService.getAll().find(route => route.path === `/${projectName}`);
          
          // 更新卡片的路由ID
          if (projectRoute) {
            // 更新卡片的 route_id 和 route_path
            const updateSql = `
              UPDATE ${this.tableName}
              SET route_id = ?, route_path = ?
              WHERE id = ?
            `;
            db.run(updateSql, [projectRoute.id, `/${projectName}`, newCard.id]);
            
            // 如果是常规项目且有菜单项，创建自定义子路由
            if (newCard.type === 'project' && data.menuItems && data.menuItems.length > 0) {
              // 重新获取所有路由，确保包含新创建的子路由
              const updatedRoutes = routeService.getAll();
              
              // 删除默认生成的子路由
              const defaultSubRoutes = updatedRoutes.filter(route => route.parentId === projectRoute.id);
              for (const subRoute of defaultSubRoutes) {
                routeService.delete(subRoute.id);
              }
              
              // 创建自定义菜单项路由
              for (let i = 0; i < data.menuItems.length; i++) {
                const menuItem = data.menuItems[i];
                
                // 验证菜单项路由路径格式
                if (!menuItem.routePath.startsWith('/')) {
                  throw new Error(`Menu item route path must start with /: ${menuItem.routePath}`);
                }
                
                // 从路由路径中提取name，确保name字段只包含英文、数字和下划线
                const pathParts = menuItem.routePath.split('/').filter(Boolean);
                const routeName = pathParts[pathParts.length - 1] || 'home';
                
                // 创建子路由记录
                const subRouteData: CreateRouteRequest = {
                  path: menuItem.routePath,
                  name: `${projectName}-${routeName}`,
                  projectId: projectName,
                  projectType: projectType,
                  title: menuItem.title,
                  icon: menuItem.icon,
                  requiresAuth: true,
                  showInMenu: true,
                  showInTabs: false,
                  order: i + 1,
                  parentId: projectRoute.id
                };
                
                routeService.create(subRouteData);
              }
            }
          }
        }
      }
      
      // 确保返回的对象是干净的、可序列化的
      if (newCard) {
        return {
          id: newCard.id,
          title: newCard.title,
          description: newCard.description,
          icon: newCard.icon,
          isFavorite: newCard.isFavorite,
          type: newCard.type,
          routeId: newCard.routeId,
          routePath: newCard.routePath,
          lastClickedAt: newCard.lastClickedAt,
          createdAt: newCard.createdAt,
          updatedAt: newCard.updatedAt
        };
      }
      return null;
    } catch (error: any) {
      console.error('Failed to create card:', error.message);
      throw error;
    }
  }

  /**
   * 更新卡片
   */
  update(id: number, data: UpdateCardRequest & { menuItems?: Array<{ title: string; icon: string; routePath: string }> }): Card | null {
    // 获取原卡片信息
    const oldCard = this.getById(id);
    
    const sql = `
      UPDATE ${this.tableName}
      SET 
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        icon = COALESCE(?, icon),
        is_favorite = COALESCE(?, is_favorite),
        type = COALESCE(?, type),
        route_id = COALESCE(?, route_id),
        route_path = COALESCE(?, route_path),
        updated_at = ?
      WHERE ${this.idField} = ?
    `;
    
    db.run(sql, [
      data.title,
      data.description,
      data.icon,
      data.isFavorite === undefined ? null : (data.isFavorite ? 1 : 0),
      data.type,
      (data as UpdateCardRequest).routeId,
      data.routePath,
      getCurrentLocalTimeForSqlite(),
      id
    ]);
    
    const updatedCard = this.getById(id);
    
    // 如果路由路径或类型发生变化，或者提供了菜单项数据，才更新对应的路由记录
    if (updatedCard) {
      const oldRoutePath = oldCard?.routePath;
      const newRoutePath = updatedCard.routePath;
      const oldType = oldCard?.type;
      const newType = updatedCard.type;
      
      // 检查是否需要更新路由结构
      const needsRouteUpdate = 
        oldRoutePath !== newRoutePath || 
        oldType !== newType || 
        (data.menuItems && data.menuItems.length > 0);
      
      // 只有当需要更新路由结构时，才执行路由更新逻辑
      if (needsRouteUpdate) {
        // 主路由ID
        let mainRouteId: number | undefined;
        
        // 如果原卡片有路由路径，删除对应的路由记录
        if (oldRoutePath && oldRoutePath !== newRoutePath) {
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
        } else if (oldRoutePath === newRoutePath) {
          // 如果路由路径未变化，获取主路由ID
          const allRoutes = routeService.getAll();
          const existingMainRoute = allRoutes.find(route => route.path === newRoutePath);
          if (existingMainRoute) {
            mainRouteId = existingMainRoute.id;
            
            // 只有在提供了菜单项数据时才删除现有的子路由
            // 这样更新收藏状态时就不会影响现有的路由结构
            if (data.menuItems && data.menuItems.length > 0) {
              // 删除所有现有子路由
              const existingSubRoutes = allRoutes.filter(route => route.parentId === existingMainRoute.id);
              for (const subRoute of existingSubRoutes) {
                routeService.delete(subRoute.id);
              }
            }
          }
        }
        
        // 如果新卡片有路由路径，创建或更新路由记录
        if (newRoutePath) {
          // 提取项目名称
          const pathParts = newRoutePath.split('/').filter(Boolean);
          if (pathParts.length > 0) {
            const projectName = pathParts[0];
            // 根据卡片类型确定项目类型
            const projectType = updatedCard.type === 'project' ? 'regular' : 'other';
            
            // 只有在需要更新路由结构时才创建项目路由
            // 检查项目根路由是否已经存在
            let allRoutes = routeService.getAll();
            const projectRouteExists = allRoutes.find(route => route.path === `/${projectName}`);
            
            // 只有当项目根路由不存在时才创建
            if (!projectRouteExists) {
              routeService.createProjectRoutes(projectName, projectType);
              // 创建后重新获取所有路由
              allRoutes = routeService.getAll();
            }
            
            // 获取项目根路由
            const projectRoute = allRoutes.find(route => route.path === `/${projectName}`);
            
            // 更新项目根路由的图标，使其与卡片图标一致
            if (projectRoute) {
              routeService.update(projectRoute.id, {
                icon: updatedCard.icon || 'i-carbon-folder'
              });
            }
            
            // 更新卡片的路由ID
            if (projectRoute) {
              // 更新卡片的 route_id 和 route_path
              const updateSql = `
                UPDATE ${this.tableName}
                SET route_id = ?, route_path = ?
                WHERE id = ?
              `;
              db.run(updateSql, [projectRoute.id, `/${projectName}`, updatedCard.id]);
              
              // 如果是常规项目且有菜单项，创建自定义子路由
              if (updatedCard.type === 'project' && data.menuItems && data.menuItems.length > 0) {
                // 删除默认生成的子路由
                const defaultSubRoutes = allRoutes.filter(route => route.parentId === projectRoute.id);
                for (const subRoute of defaultSubRoutes) {
                  routeService.delete(subRoute.id);
                }
                
                // 创建自定义菜单项路由
                for (let i = 0; i < data.menuItems.length; i++) {
                  const menuItem = data.menuItems[i];
                  
                  // 验证菜单项路由路径格式
                  if (!menuItem.routePath.startsWith('/')) {
                    throw new Error(`Menu item route path must start with /: ${menuItem.routePath}`);
                  }
                  
                  // 从路由路径中提取name，确保name字段只包含英文、数字和下划线
                  const pathParts = menuItem.routePath.split('/').filter(Boolean);
                  const routeName = pathParts[pathParts.length - 1] || 'home';
                  
                  // 创建子路由记录
                  const subRouteData: CreateRouteRequest = {
                    path: menuItem.routePath,
                    name: `${projectName}-${routeName}`,
                    projectId: projectName,
                    projectType: projectType,
                    title: menuItem.title,
                    icon: menuItem.icon,
                    requiresAuth: true,
                    parentId: projectRoute.id,
                    showInMenu: true,
                    showInTabs: false,
                    order: i + 1
                  };
                  
                  routeService.create(subRouteData);
                }
              }
            }
          }
        }
      }
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
      // 查找并删除对应的路由记录
      const allRoutes = routeService.getAll();
      const route = allRoutes.find(r => r.path === card.routePath);
      if (route) {
        routeService.delete(route.id);
      }
    }
    
    return result;
  }
}

// 导出单例实例
export const cardService = new CardService();