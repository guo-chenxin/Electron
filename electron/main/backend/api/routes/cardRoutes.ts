import { ipcMain } from 'electron';
import { cardService } from '../../services/cardService';

/**
 * 注册卡片相关API路由
 */
export function registerCardRoutes(): void {
  // 获取所有卡片
  ipcMain.handle('api:cards:getAll', (_, limit = 100, offset = 0) => {
    try {
      return cardService.getAll(limit, offset);
    } catch (error) {
      console.error('Error in getAll cards:', error);
      throw error;
    }
  });

  // 根据ID获取卡片
  ipcMain.handle('api:cards:getById', (_, id: number) => {
    try {
      return cardService.getById(id);
    } catch (error) {
      console.error('Error in getById card:', error);
      throw error;
    }
  });



  // 创建卡片
  ipcMain.handle('api:cards:create', (_, cardData: any) => {
    try {
      return cardService.create(cardData);
    } catch (error) {
      console.error('Error in create card:', error);
      throw error;
    }
  });

  // 更新卡片
  ipcMain.handle('api:cards:update', (_, id: number, cardData: any) => {
    try {
      return cardService.update(id, cardData);
    } catch (error) {
      console.error('Error in update card:', error);
      throw error;
    }
  });

  // 删除卡片
  ipcMain.handle('api:cards:delete', (_, id: number) => {
    try {
      return cardService.delete(id);
    } catch (error) {
      console.error('Error in delete card:', error);
      throw error;
    }
  });


}