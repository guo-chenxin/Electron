import { ipcMain } from 'electron';
import { userService } from '../../services/userService';

/**
 * 注册用户相关API路由
 */
export function registerUserRoutes(): void {
  // 获取所有用户
  ipcMain.handle('api:users:getAll', async () => {
    try {
      return await userService.getAll();
    } catch (error) {
      console.error('Error in getAll:', error);
      throw error;
    }
  });

  // 根据ID获取用户
  ipcMain.handle('api:users:getById', async (_, id: number) => {
    try {
      return await userService.getById(id);
    } catch (error) {
      console.error('Error in getById:', error);
      throw error;
    }
  });

  // 根据用户名获取用户
  ipcMain.handle('api:users:getByUsername', async (_, username: string) => {
    try {
      return await userService.getUserByUsername(username);
    } catch (error) {
      console.error('Error in getUserByUsername:', error);
      throw error;
    }
  });

  // 创建用户
  ipcMain.handle('api:users:create', async (_, userData: any) => {
    try {
      return await userService.create(userData);
    } catch (error) {
      console.error('Error in create:', error);
      throw error;
    }
  });

  // 更新用户
  ipcMain.handle('api:users:update', async (_, id: number, userData: any) => {
    try {
      return await userService.update(id, userData);
    } catch (error) {
      console.error('Error in update:', error);
      throw error;
    }
  });

  // 删除用户
  ipcMain.handle('api:users:delete', async (_, id: number) => {
    try {
      return await userService.delete(id);
    } catch (error) {
      console.error('Error in delete:', error);
      throw error;
    }
  });
}