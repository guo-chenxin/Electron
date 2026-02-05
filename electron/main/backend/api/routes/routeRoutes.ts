/**
 * 路由相关API路由
 */

import { ipcMain } from 'electron';
import { routeService } from '../../services/routeService';

/**
 * 注册路由相关API路由
 */
export function registerRouteRoutes(): void {
  // 获取所有路由（嵌套结构）
  ipcMain.handle('api:routes:getAllNested', () => {
    try {
      return routeService.getAllNested();
    } catch (error) {
      console.error('Error in getAllNested routes:', error);
      throw error;
    }
  });

  // 获取所有路由（扁平结构）
  ipcMain.handle('api:routes:getAll', () => {
    try {
      return routeService.getAll();
    } catch (error) {
      console.error('Error in getAll routes:', error);
      throw error;
    }
  });

  // 根据ID获取路由
  ipcMain.handle('api:routes:getById', (_, id: number) => {
    try {
      return routeService.getById(id);
    } catch (error) {
      console.error('Error in getById route:', error);
      throw error;
    }
  });

  // 创建路由
  ipcMain.handle('api:routes:create', (_, routeData: any) => {
    try {
      return routeService.create(routeData);
    } catch (error) {
      console.error('Error in create route:', error);
      throw error;
    }
  });

  // 更新路由
  ipcMain.handle('api:routes:update', (_, id: number, routeData: any) => {
    try {
      return routeService.update(id, routeData);
    } catch (error) {
      console.error('Error in update route:', error);
      throw error;
    }
  });

  // 删除路由
  ipcMain.handle('api:routes:delete', (_, id: number) => {
    try {
      return routeService.delete(id);
    } catch (error) {
      console.error('Error in delete route:', error);
      throw error;
    }
  });
  
  // 创建项目路由
  ipcMain.handle('api:routes:createProjectRoutes', (_, projectName: string, cardId: number) => {
    try {
      return routeService.createProjectRoutes(projectName, cardId);
    } catch (error) {
      console.error('Error in createProjectRoutes:', error);
      throw error;
    }
  });
} 