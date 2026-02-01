import { ipcMain } from 'electron';
import { articleService } from '../../services/articleService';

/**
 * 注册文章相关API路由
 */
export function registerArticleRoutes(): void {
  // 获取所有文章
  ipcMain.handle('api:articles:getAll', async (_, limit: number = 100, offset: number = 0) => {
    try {
      return await articleService.getAll(limit, offset);
    } catch (error) {
      console.error('Error in getAll:', error);
      throw error;
    }
  });

  // 根据ID获取文章
  ipcMain.handle('api:articles:getById', async (_, id: number) => {
    try {
      return await articleService.getById(id);
    } catch (error) {
      console.error('Error in getById:', error);
      throw error;
    }
  });

  // 根据作者ID获取文章
  ipcMain.handle('api:articles:getByAuthorId', async (_, authorId: number, limit: number = 100, offset: number = 0) => {
    try {
      return await articleService.getArticlesByAuthorId(authorId, limit, offset);
    } catch (error) {
      console.error('Error in getArticlesByAuthorId:', error);
      throw error;
    }
  });

  // 根据分类ID获取文章
  ipcMain.handle('api:articles:getByCategoryId', async (_, categoryId: number, limit: number = 100, offset: number = 0) => {
    try {
      return await articleService.getArticlesByCategoryId(categoryId, limit, offset);
    } catch (error) {
      console.error('Error in getArticlesByCategoryId:', error);
      throw error;
    }
  });

  // 根据状态获取文章
  ipcMain.handle('api:articles:getByStatus', async (_, status: string, limit: number = 100, offset: number = 0) => {
    try {
      return await articleService.getArticlesByStatus(status as any, limit, offset);
    } catch (error) {
      console.error('Error in getArticlesByStatus:', error);
      throw error;
    }
  });

  // 创建文章
  ipcMain.handle('api:articles:create', async (_, articleData: any) => {
    try {
      return await articleService.create(articleData);
    } catch (error) {
      console.error('Error in create:', error);
      throw error;
    }
  });

  // 更新文章
  ipcMain.handle('api:articles:update', async (_, id: number, articleData: any) => {
    try {
      return await articleService.update(id, articleData);
    } catch (error) {
      console.error('Error in update:', error);
      throw error;
    }
  });

  // 删除文章
  ipcMain.handle('api:articles:delete', async (_, id: number) => {
    try {
      return await articleService.delete(id);
    } catch (error) {
      console.error('Error in delete:', error);
      throw error;
    }
  });

  // 增加文章浏览量
  ipcMain.handle('api:articles:incrementViewCount', async (_, id: number) => {
    try {
      return await articleService.incrementViewCount(id);
    } catch (error) {
      console.error('Error in incrementViewCount:', error);
      throw error;
    }
  });
}