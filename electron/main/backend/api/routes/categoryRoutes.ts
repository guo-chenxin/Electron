import { ipcMain } from 'electron';
import { categoryService } from '../../services/categoryService';

/**
 * 注册分类相关API路由
 */
export function registerCategoryRoutes(): void {
  // 获取所有分类
  ipcMain.handle('api:categories:getAll', async () => {
    try {
      return await categoryService.getAll();
    } catch (error) {
      console.error('Error in getAll:', error);
      throw error;
    }
  });

  // 根据ID获取分类
  ipcMain.handle('api:categories:getById', async (_, id: number) => {
    try {
      return await categoryService.getById(id);
    } catch (error) {
      console.error('Error in getById:', error);
      throw error;
    }
  });

  // 创建分类
  ipcMain.handle('api:categories:create', async (_, categoryData: any) => {
    try {
      return await categoryService.create(categoryData);
    } catch (error) {
      console.error('Error in create:', error);
      throw error;
    }
  });

  // 更新分类
  ipcMain.handle('api:categories:update', async (_, id: number, categoryData: any) => {
    try {
      return await categoryService.update(id, categoryData);
    } catch (error) {
      console.error('Error in update:', error);
      throw error;
    }
  });

  // 删除分类
  ipcMain.handle('api:categories:delete', async (_, id: number) => {
    try {
      return await categoryService.delete(id);
    } catch (error) {
      console.error('Error in delete:', error);
      throw error;
    }
  });

  // 获取分类统计信息
  ipcMain.handle('api:categories:getStatistics', async () => {
    try {
      return await categoryService.getCategoryStatistics();
    } catch (error) {
      console.error('Error in getCategoryStatistics:', error);
      throw error;
    }
  });
}