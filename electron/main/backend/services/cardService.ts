// 卡片服务类
import { db } from '../db/database';
import { Card, CreateCardRequest, UpdateCardRequest } from '../models';
import { BaseService } from './baseService';
import { routeService } from './routeService';
import { cardRouteService } from './cardRouteService';
import { convertUtcToLocal, getCurrentLocalTimeForSqlite } from '../utils/dateUtils';
import { ErrorHandler } from '../utils/errorUtils';

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

      routeId: row.route_id,
      routePath: row.route_path,
      lastClickedAt: convertUtcToLocal(row.last_clicked_at),
      createdAt: convertUtcToLocal(row.created_at),
      updatedAt: convertUtcToLocal(row.updated_at),
      // 初始化菜单项数组
      menuItems: []
    };

    // 如果卡片有路由ID，获取对应的根路由信息和菜单项（子路由）
    if (row.route_id) {
      // 获取根路由信息
      const rootRoute = routeService.getById(row.route_id);
      if (rootRoute) {
        // 添加根路由的附加信息
        card.redirect = rootRoute.redirect;
        card.requiresAuth = rootRoute.requiresAuth;
        card.showInMenu = rootRoute.showInMenu;
        card.showInTabs = rootRoute.showInTabs;
        card.order = rootRoute.order;
      }
      
      // 获取子路由作为菜单项，并按照order字段排序，order相同则按创建时间排序
      const childRoutes = routeService.getAll().filter(route => route.parentId === row.route_id);
      card.menuItems = childRoutes
        .map(route => ({
          id: route.id,
          title: route.title || '',
          icon: route.icon || '',
          routePath: route.path || '',
          component: route.component || '',
          requiresAuth: route.requiresAuth,
          showInMenu: route.showInMenu,
          showInTabs: route.showInTabs,
          order: route.order,
          createdAt: route.createdAt
        }))
        .sort((a, b) => {
          // 首先按照order字段排序
          if ((a.order || 0) !== (b.order || 0)) {
            return (a.order || 0) - (b.order || 0);
          }
          // order相同则按照创建时间排序
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        });
    }

    return card;
  }

  /**
   * 验证卡片数据
   */
  private validateCardData(data: any): void {
    if (!data.title) {
      throw ErrorHandler.createValidationError('Title is required');
    }
    
    if (data.routePath && !data.routePath.startsWith('/')) {
      throw ErrorHandler.createValidationError('Route path must start with /');
    }
  }

  /**
   * 保存卡片记录
   */
  private saveCardRecord(data: any): Card | null {
    const sql = `
      INSERT INTO ${this.tableName} (title, description, icon, route_id, route_path)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    // 准备参数，处理可选字段
    const params = [
      data.title, // 必填字段，不能为空
      data.description || null, // 可选字段，为空时使用null
      data.icon || null, // 可选字段，为空时使用null
      null, // route_id，稍后设置
      data.routePath || null // 可选字段，为空时使用null
    ];
    
    try {
      const result = db.run(sql, params);
      return this.getById(result.lastID);
    } catch (error: any) {
      console.error('Failed to save card record:', error.message);
      throw error;
    }
  }

  /**
   * 更新卡片记录
   */
  private updateCardRecord(cardId: number, data: any): Card | null {
    const sql = `
      UPDATE ${this.tableName}
      SET 
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        icon = COALESCE(?, icon),
        route_id = COALESCE(?, route_id),
        route_path = COALESCE(?, route_path),
        updated_at = ?
      WHERE ${this.idField} = ?
    `;
    
    try {
      db.run(sql, [
        data.title,
        data.description,
        data.icon,

        (data as UpdateCardRequest).routeId,
        data.routePath,
        getCurrentLocalTimeForSqlite(),
        cardId
      ]);
      return this.getById(cardId);
    } catch (error: any) {
      console.error('Failed to update card record:', error.message);
      throw error;
    }
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
   * 创建卡片
   */
  create(data: CreateCardRequest & { menuItems?: Array<{ title: string; icon: string; routePath: string; component?: string; requiresAuth?: boolean; showInMenu?: boolean; showInTabs?: boolean; order?: number }> }): Card | null {
    // 验证必填字段
    this.validateCardData(data);
    
    // 保存卡片记录
    const newCard = this.saveCardRecord(data);
    
    // 处理路由创建
    if (newCard && newCard.routePath) {
      cardRouteService.handleRouteCreation(newCard, data);
    }
    
    return newCard;
  }

  /**
   * 更新卡片
   */
  update(id: number, data: UpdateCardRequest & { menuItems?: Array<{ id?: number; title: string; icon: string; routePath: string; component?: string; requiresAuth?: boolean; showInMenu?: boolean; showInTabs?: boolean; order?: number }> }): Card | null {
    // 获取原卡片信息
    const oldCard = this.getById(id);
    if (!oldCard) return null;
    
    // 更新卡片记录
    const updatedCard = this.updateCardRecord(id, data);
    
    // 处理路由更新
    if (updatedCard) {
      cardRouteService.handleRouteUpdate(updatedCard, oldCard, data);
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
      cardRouteService.deleteCardRoutes(card);
    }
    
    return result;
  }
}

// 导出单例实例
export const cardService = new CardService();
