/**
 * 路由实体接口
 */
export interface Route {
  id: number;
  path: string;
  name?: string;
  component?: string;
  redirect?: string;
  parentId?: number;
  projectId?: string;           // 项目标识，用于多项目管理
  projectType?: string;         // 项目类型（regular: 常规项目，other: 其他项目）
  title?: string;
  icon?: string;
  requiresAuth?: boolean;
  permission?: string;
  keepAlive?: boolean;
  showInMenu?: boolean;
  showInTabs?: boolean;
  alwaysShow?: boolean;
  order?: number;
  createdAt: string;
  updatedAt: string;
  children?: Route[];
}