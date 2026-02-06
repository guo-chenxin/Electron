/**
 * 卡片请求模型接口
 */

// 菜单项接口
export interface MenuItem {
  title: string;
  icon: string;
  routePath: string;
  component?: string;
  requiresAuth?: boolean;
  showInMenu?: boolean;
  showInTabs?: boolean;
  order?: number;
}

// 创建卡片请求
export interface CreateCardRequest {
  title: string;
  description?: string;
  icon?: string;
  routeId?: number;
  routePath?: string;
  redirect?: string;
  requiresAuth?: boolean;
  showInMenu?: boolean;
  showInTabs?: boolean;
  order?: number;
  menuItems?: MenuItem[];
}

// 更新卡片请求
export interface UpdateCardRequest {
  title?: string;
  description?: string;
  icon?: string;
  routeId?: number;
  routePath?: string;
  redirect?: string;
  requiresAuth?: boolean;
  showInMenu?: boolean;
  showInTabs?: boolean;
  order?: number;
  menuItems?: MenuItem[];
}