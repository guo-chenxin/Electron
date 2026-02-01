/**
 * 卡片请求模型接口
 */

// 创建卡片请求
export interface CreateCardRequest {
  title: string;
  description?: string;
  icon?: string;
  type?: string;
  routeId?: number;
  routePath?: string;
}

// 更新卡片请求
export interface UpdateCardRequest {
  title?: string;
  description?: string;
  icon?: string;
  isFavorite?: boolean;
  type?: string;
  routeId?: number;
  routePath?: string;
}