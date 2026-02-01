/**
 * 卡片模型接口
 */
export interface Card {
  id: number;
  title: string;
  description?: string;
  icon?: string;
  isFavorite: boolean;
  type: string; // 卡片类型（project或other）
  routeId?: number; // 关联的路由ID
  routePath?: string; // 跳转路由
  menuItems?: Array<{ title: string; icon: string; routePath: string }>; // 菜单项
  lastClickedAt: string;
  createdAt: string;
  updatedAt: string;
}