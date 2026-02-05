// 项目路由相关类型定义

/**
 * 菜单项类型
 */
export interface MenuItem {
  /** 菜单项ID */
  id?: number;
  /** 菜单项标题 */
  title: string;
  /** 菜单项图标 */
  icon: string;
  /** 菜单项路由路径 */
  routePath: string;
  /** 菜单项组件路径 */
  component?: string;
  /** 是否显示在菜单中 */
  showInMenu?: boolean;
  /** 是否显示在标签页中 */
  showInTabs?: boolean;
  /** 是否需要认证 */
  requiresAuth?: boolean;
  /** 菜单顺序 */
  order?: number;
}

/**
 * 项目表单数据类型
 */
export interface ProjectFormData {
  /** 项目标题 */
  title: string;
  /** 项目描述 */
  description: string;
  /** 项目图标 */
  icon: string;
  /** 项目路由路径 */
  routePath: string;
  /** 项目重定向路径 */
  redirect: string;
  /** 是否显示在菜单中 */
  showInMenu: boolean;
  /** 是否显示在标签页中 */
  showInTabs: boolean;
  /** 是否需要认证 */
  requiresAuth: boolean;
  /** 菜单顺序 */
  order: number;
  /** 菜单项列表 */
  menuItems: MenuItem[];
}

/**
 * 选中项类型
 */
export interface SelectedItem {
  /** 选中项类型：root表示根路由，menu表示菜单项 */
  type: 'root' | 'menu';
  /** 选中项索引：当type为menu时，表示选中的菜单项索引 */
  index: number | null;
}

/**
 * 卡片数据类型
 */
export interface CardData {
  /** 卡片ID */
  id?: number;
  /** 卡片标题 */
  title: string;
  /** 卡片描述 */
  description: string;
  /** 卡片图标 */
  icon: string;
  /** 卡片路由路径 */
  routePath: string;
  /** 卡片重定向路径 */
  redirect: string;
  /** 是否显示在菜单中 */
  showInMenu: boolean;
  /** 是否显示在标签页中 */
  showInTabs: boolean;
  /** 是否需要认证 */
  requiresAuth: boolean;
  /** 菜单顺序 */
  order: number;
  /** 菜单项列表 */
  menuItems: MenuItem[];
}

/**
 * 图标选项类型
 */
export interface IconOption {
  /** 图标标签 */
  label: string;
  /** 图标值 */
  value: string;
}
