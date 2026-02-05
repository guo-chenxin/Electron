import { ipcMain } from 'electron';
import { userService } from '../../services/userService';
import { ResponseHandler } from '../../utils/responseUtils';

/**
 * 注册用户相关API路由
 */
export function registerUserRoutes(): void {
  // 获取所有用户
  ipcMain.handle('api:users:getAll', async () => {
    try {
      const users = await userService.getAll();
      return ResponseHandler.createSuccessResponse(users, '获取用户列表成功');
    } catch (error) {
      console.error('Error in getAll:', error);
      const errorMessage = error instanceof Error ? error.message : '获取用户列表失败';
      return ResponseHandler.createErrorResponse(errorMessage, 500);
    }
  });

  // 根据ID获取用户
  ipcMain.handle('api:users:getById', async (_, id: number) => {
    try {
      const user = await userService.getById(id);
      if (!user) {
        return ResponseHandler.createNotFoundResponse('用户不存在');
      }
      return ResponseHandler.createSuccessResponse(user, '获取用户信息成功');
    } catch (error) {
      console.error('Error in getById:', error);
      const errorMessage = error instanceof Error ? error.message : '获取用户信息失败';
      return ResponseHandler.createErrorResponse(errorMessage, 500);
    }
  });

  // 根据用户名获取用户
  ipcMain.handle('api:users:getByUsername', async (_, username: string) => {
    try {
      const user = await userService.getUserByUsername(username);
      if (!user) {
        return ResponseHandler.createNotFoundResponse('用户不存在');
      }
      return ResponseHandler.createSuccessResponse(user, '获取用户信息成功');
    } catch (error) {
      console.error('Error in getUserByUsername:', error);
      const errorMessage = error instanceof Error ? error.message : '获取用户信息失败';
      return ResponseHandler.createErrorResponse(errorMessage, 500);
    }
  });

  // 创建用户
  ipcMain.handle('api:users:create', async (_, userData: any) => {
    try {
      const user = await userService.create(userData);
      return ResponseHandler.createCreatedResponse(user, '用户创建成功');
    } catch (error) {
      console.error('Error in create:', error);
      const errorMessage = error instanceof Error ? error.message : '用户创建失败';
      return ResponseHandler.createErrorResponse(errorMessage, 500);
    }
  });

  // 更新用户
  ipcMain.handle('api:users:update', async (_, id: number, userData: any) => {
    try {
      const user = await userService.update(id, userData);
      if (!user) {
        return ResponseHandler.createNotFoundResponse('用户不存在');
      }
      return ResponseHandler.createUpdatedResponse(user, '用户更新成功');
    } catch (error) {
      console.error('Error in update:', error);
      const errorMessage = error instanceof Error ? error.message : '用户更新失败';
      return ResponseHandler.createErrorResponse(errorMessage, 500);
    }
  });

  // 删除用户
  ipcMain.handle('api:users:delete', async (_, id: number) => {
    try {
      const result = await userService.delete(id);
      if (!result) {
        return ResponseHandler.createNotFoundResponse('用户不存在');
      }
      return ResponseHandler.createDeletedResponse('用户删除成功');
    } catch (error) {
      console.error('Error in delete:', error);
      const errorMessage = error instanceof Error ? error.message : '用户删除失败';
      return ResponseHandler.createErrorResponse(errorMessage, 500);
    }
  });
}