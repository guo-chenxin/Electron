import { CreateRouteRequest } from '../models';
import { routeService } from '../services/routeService';

/**
 * 基础路由配置
 * 只包含必要的基础路由，不包含特定项目路由
 * 特定项目路由由用户创建项目时动态生成
 */
const baseRoutes: CreateRouteRequest[] = [
  {
    path: '/',
    name: 'main',
    title: '主窗口',
    icon: 'i-carbon-home',
    requiresAuth: false,
    showInMenu: true,
    showInTabs: true,

    order: 999,
    redirect: '/main/project-management'
  },
  {
    path: '/main/project-management',
    name: 'project-management',
    title: '项目管理',
    icon: 'i-carbon-grid',
    requiresAuth: true,
    parentId: undefined,
    showInMenu: true,
    showInTabs: false,
    order: 1
  }
];

export async function seedInitialRoutes(): Promise<void> {
  try {
    const allRoutes = routeService.getAll();
    if (allRoutes.length === 0) {
      console.log('Seeding initial routes...');
      
      // 1. 创建根路由
      const rootRoute = baseRoutes.find(route => route.path === '/');
      if (rootRoute) {
        routeService.create(rootRoute);
      }
      
      // 2. 获取更新后的路由列表
      const updatedRoutes = routeService.getAll();
      const mainRoute = updatedRoutes.find(r => r.path === '/');
      
      // 3. 创建主窗口子路由
      const mainSubRoutes = baseRoutes.filter(route => 
        route.path.startsWith('/main/')
      );
      
      if (mainRoute) {
        for (const route of mainSubRoutes) {
          routeService.create({
            ...route,
            parentId: mainRoute.id
          });
        }
      }
      
      console.log('Initial routes seeded successfully');
      console.log('Base routes initialized. Specific project routes will be created when projects are added.');
    }
  } catch (error) {
    console.error('Failed to seed initial routes:', error);
    // 不抛出错误，允许应用继续启动
  }
}