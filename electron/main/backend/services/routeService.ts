/**
 * 路由服务类
 */

import { db } from '../db/database';
import { Route, CreateRouteRequest, UpdateRouteRequest } from '../models';
import { BaseService } from './baseService';
import { convertUtcToLocal, getCurrentLocalTimeForSqlite } from '../utils/dateUtils';



// 路由服务类
export class RouteService extends BaseService<Route, CreateRouteRequest, UpdateRouteRequest> {
  protected tableName = 'routes';
  protected idField = 'id';

  /**
   * 将数据库字段映射为Route对象（处理下划线命名到驼峰命名的转换）
   * @param row 数据库查询结果行
   * @returns 映射后的Route对象
   */
  protected mapFields(row: any): Route {
    return {
      id: row.id,
      path: row.path,
      name: row.name,
      component: row.component,
      redirect: row.redirect,
      parentId: row.parent_id,
      projectId: row.project_id,
      title: row.title,
      icon: row.icon,
      requiresAuth: row.requires_auth === 1,
      permission: row.permission,
      keepAlive: row.keep_alive === 1,
      showInMenu: row.show_in_menu === 1,
      showInTabs: row.show_in_tabs === 1,
      order: row.order,
      createdAt: convertUtcToLocal(row.created_at),
      updatedAt: convertUtcToLocal(row.updated_at)
    } as Route;
  }

  /**
   * 验证路由路径唯一性
   * @param path 路由路径
   */
  private validateRoutePathUnique(path: string): void {
    const existingRoute = this.getAll().find(route => route.path === path);
    if (existingRoute) {
      throw new Error(`Route with path "${path}" already exists`);
    }
  }

  /**
   * 验证父路由存在
   * @param parentId 父路由ID
   */
  private validateParentRouteExists(parentId: number): void {
    const parentRoute = this.getById(parentId);
    if (!parentRoute) {
      throw new Error(`Parent route with ID "${parentId}" does not exist`);
    }
  }

  /**
   * 验证路由路径格式
   * @param path 路由路径
   */
  private validateRoutePathFormat(path: string): void {
    // 确保路径以斜杠开头
    if (!path.startsWith('/')) {
      throw new Error(`Route path "${path}" must start with a slash`);
    }
    
    // 避免重复斜杠
    if (path.includes('//')) {
      throw new Error(`Route path "${path}" contains duplicate slashes`);
    }
  }

  /**
   * 将扁平路由数组转换为嵌套路由结构
   * @param routes 扁平路由数组
   * @param parentId 父路由ID，默认为null
   * @returns 嵌套结构的路由数组
   */
  private buildNestedRoutes(routes: Route[], parentId: number | null = null): Route[] {
    return routes
      .filter(route => route.parentId === parentId)
      .sort((a, b) => {
        // 首先按照order字段排序
        if ((a.order || 0) !== (b.order || 0)) {
          return (a.order || 0) - (b.order || 0);
        }
        // order相同则按照创建时间排序
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      })
      .map(route => ({
        ...route,
        children: this.buildNestedRoutes(routes, route.id)
      }));
  }

  /**
   * 创建项目根路由
   * @param projectName 项目名称
   * @param cardId 卡片ID
   * @returns 创建的根路由
   */
  private createProjectRootRoute(projectName: string, cardId: number): Route | null {
    return this.create({
      path: `/${projectName}`,
      name: projectName,
      projectId: cardId.toString(),
      title: projectName.charAt(0).toUpperCase() + projectName.slice(1),
      icon: 'i-carbon-folder',
      requiresAuth: true,
      showInMenu: true,
      showInTabs: true,
      order: 999,
      redirect: `/${projectName}/home`
    });
  }

  /**
   * 创建项目首页路由
   * @param projectName 项目名称
   * @param cardId 卡片ID
   * @param parentId 父路由ID
   * @returns 创建的首页路由
   */
  private createProjectHomeRoute(projectName: string, cardId: number, parentId: number): Route | null {
    return this.create({
      path: `/${projectName}/home`,
      name: `${projectName}-home`,
      projectId: cardId.toString(),
      title: '首页',
      icon: 'i-carbon-home',
      requiresAuth: true,
      parentId: parentId,
      showInMenu: true,
      showInTabs: true,
      order: 1
    });
  }

  /**
   * 创建项目设置路由
   * @param projectName 项目名称
   * @param cardId 卡片ID
   * @param parentId 父路由ID
   * @returns 创建的设置路由
   */
  private createProjectSettingsRoute(projectName: string, cardId: number, parentId: number): Route | null {
    return this.create({
      path: `/${projectName}/settings`,
      name: `${projectName}-settings`,
      projectId: cardId.toString(),
      title: '设置',
      icon: 'i-carbon-settings',
      requiresAuth: true,
      parentId: parentId,
      showInMenu: true,
      showInTabs: true,
      order: 99
    });
  }

  /**
   * 获取所有路由，包括嵌套路由结构
   * @returns 嵌套结构的路由数组
   */
  getAllNested(): Route[] {
    // 获取所有路由
    const allRoutes = this.getAll();
    
    // 将路由转换为嵌套结构
    return this.buildNestedRoutes(allRoutes);
  }

  /**
   * 创建路由
   * @param data 创建路由的请求数据
   * @returns 创建的路由对象
   */
  create(data: CreateRouteRequest): Route | null {
    // 验证必填字段
    if (!data.path) {
      throw new Error('Path is required');
    }
    
    // 验证路由路径唯一性
    this.validateRoutePathUnique(data.path);
    
    // 验证父路由存在
    if (data.parentId !== undefined && data.parentId !== null) {
      this.validateParentRouteExists(data.parentId);
    }
    
    // 验证路由路径格式
    this.validateRoutePathFormat(data.path);
    
    const sql = `
      INSERT INTO ${this.tableName} (
        path, name, component, redirect, parent_id, project_id, title, icon, requires_auth, permission, keep_alive, show_in_menu, show_in_tabs, "order"
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    // 准备参数，处理可选字段
    const params = [
      data.path, // 必填字段，不能为空
      data.name || null,
      data.component || null,
      data.redirect || null,
      data.parentId || null,
      data.projectId || null,
      data.title || null,
      data.icon || null,
      data.requiresAuth ? 1 : 0,
      data.permission || null,
      data.keepAlive ? 1 : 0,
      data.showInMenu !== false ? 1 : 0,
      data.showInTabs !== false ? 1 : 0,
      data.order || 0
    ];
    
    try {
      const result = db.run(sql, params);
      return this.getById(result.lastID);
    } catch (error: any) {
      console.error('Failed to create route:', error.message);
      throw error;
    }
  }

  /**
   * 更新路由
   * @param id 路由ID
   * @param data 更新路由的请求数据
   * @returns 更新后的路由对象
   */
  update(id: number, data: UpdateRouteRequest): Route | null {
    const sql = `
      UPDATE ${this.tableName}
      SET 
        path = COALESCE(?, path),
        name = COALESCE(?, name),
        component = COALESCE(?, component),
        redirect = COALESCE(?, redirect),
        parent_id = COALESCE(?, parent_id),
        project_id = COALESCE(?, project_id),
        title = COALESCE(?, title),
        icon = COALESCE(?, icon),
        requires_auth = COALESCE(?, requires_auth),
        permission = COALESCE(?, permission),
        keep_alive = COALESCE(?, keep_alive),
        show_in_menu = COALESCE(?, show_in_menu),
        show_in_tabs = COALESCE(?, show_in_tabs),
        "order" = COALESCE(?, "order"),
        updated_at = ?
      WHERE ${this.idField} = ?
    `;
    
    const params = [
      data.path,
      data.name,
      data.component,
      data.redirect,
      data.parentId,
      data.projectId,
      data.title,
      data.icon,
      data.requiresAuth === undefined ? null : (data.requiresAuth ? 1 : 0),
      data.permission,
      data.keepAlive === undefined ? null : (data.keepAlive ? 1 : 0),
      data.showInMenu === undefined ? null : (data.showInMenu ? 1 : 0),
      data.showInTabs === undefined ? null : (data.showInTabs ? 1 : 0),
      data.order,
      getCurrentLocalTimeForSqlite(),
      id
    ];
    
    try {
      db.run(sql, params);
      return this.getById(id);
    } catch (error: any) {
      console.error('Failed to update route:', error.message);
      throw error;
    }
  }

  /**
   * 为新项目创建对应的路由结构
   * @param projectName 项目名称
   * @param cardId 卡片ID
   * @returns 创建的路由数组
   */
  createProjectRoutes(projectName: string, cardId: number): Route[] {
    const createdRoutes: Route[] = [];
    
    // 检查项目根路由是否已经存在
    let projectRoute: Route | null = this.getAll().find(route => route.path === `/${projectName}`) || null;
    
    // 只有当项目根路由不存在时才创建
    if (!projectRoute) {
      projectRoute = this.createProjectRootRoute(projectName, cardId);
    }
      
    if (projectRoute) {
      createdRoutes.push(projectRoute);
      
      // 检查首页子路由是否已经存在
      const homeRouteExists = this.getAll().find(route => route.path === `/${projectName}/home`);
      if (!homeRouteExists) {
        const homeRoute = this.createProjectHomeRoute(projectName, cardId, projectRoute.id);
        if (homeRoute) {
          createdRoutes.push(homeRoute);
        }
      }
      
      // 检查设置子路由是否已经存在
      const settingsRouteExists = this.getAll().find(route => route.path === `/${projectName}/settings`);
      if (!settingsRouteExists) {
        const settingsRoute = this.createProjectSettingsRoute(projectName, cardId, projectRoute.id);
        if (settingsRoute) {
          createdRoutes.push(settingsRoute);
        }
      }
    }
    
    return createdRoutes;
  }
}

// 导出单例实例
export const routeService = new RouteService();
