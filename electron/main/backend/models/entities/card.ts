/**
 * 卡片模型接口
 */
export interface Card {
  id: number;
  title: string;
  description?: string;
  icon?: string;
  routeId?: number; // 关联的路由ID
  routePath?: string; // 跳转路由
  redirect?: string; // 重定向路径
  requiresAuth?: boolean; // 是否需要认证
  showInMenu?: boolean; // 是否显示在菜单
  showInTabs?: boolean; // 是否显示在标签页
  order?: number; // 菜单顺序
  menuItems?: Array<{ 
    title: string; 
    icon: string; 
    routePath: string;
    component?: string;
    requiresAuth?: boolean;
    showInMenu?: boolean;
    showInTabs?: boolean;
    order?: number;
  }>; // 菜单项
  lastClickedAt: string;
  createdAt: string;
  updatedAt: string;
}