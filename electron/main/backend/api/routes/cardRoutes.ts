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

  // 获取收藏的卡片
  ipcMain.handle('api:cards:getFavorites', (_, limit = 100, offset = 0) => {
    try {
      return cardService.getFavoriteCards(limit, offset);
    } catch (error) {
      console.error('Error in getFavorites cards:', error);
      throw error;
    }
  });

  // 获取最近访问的卡片
  ipcMain.handle('api:cards:getRecent', (_, limit = 100, offset = 0) => {
    try {
      return cardService.getRecentCards(limit, offset);
    } catch (error) {
      console.error('Error in getRecent cards:', error);
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

  // 点击卡片，更新最后访问时间
  ipcMain.handle('api:cards:click', (_, id: number) => {
    try {
      return cardService.clickCard(id);
    } catch (error) {
      console.error('Error in click card:', error);
      throw error;
    }
  });

  // 切换卡片收藏状态
  ipcMain.handle('api:cards:toggleFavorite', (_, id: number) => {
    try {
      const card = cardService.getById(id);
      if (!card) {
        throw new Error('Card not found');
      }
      return cardService.update(id, {
        isFavorite: !card.isFavorite
      });
    } catch (error) {
      console.error('Error in toggleFavorite card:', error);
      throw error;
    }
  });
}