import type { RouteRecordRaw } from 'vue-router'

/**
 * 静态路由配置
 * 核心功能路径，确保基础功能稳定
 */
export const staticRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: {
      title: '登录',
      requiresAuth: false,
      showInMenu: false
    }
  },
  {
    path: '/404',
    name: 'NotFound',
    component: () => import('../views/NotFound.vue'),
    meta: {
      title: '页面不存在',
      requiresAuth: false,
      showInMenu: false
    }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404',
    meta: {
      requiresAuth: false,
      showInMenu: false
    }
  }
]

/**
 * 基础静态路由
 * 用于初始化路由实例
 */
export const baseStaticRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    component: () => import('../views/Login.vue'),
    meta: { title: '登录', requiresAuth: false }
  }
]

/**
 * 路由配置项接口
 * 基于 RouteRecordRaw，添加自定义属性
 */
export interface AppRouteRecordRaw {
  path: string
  name?: string
  component?: () => Promise<any>
  redirect?: string
  meta: {
    title: string
    icon?: string
    requiresAuth?: boolean
    permission?: string
    keepAlive?: boolean
    showInMenu?: boolean
    showInTabs?: boolean
    order?: number
  }
  children?: AppRouteRecordRaw[]
}

/**
 * 验证路由路径格式
 * @param path 路由路径
 * @returns 是否有效
 */
export function validateRoutePath(path: string): boolean {
  // 路由必须以/开头
  if (!path.startsWith('/')) {
    return false
  }
  
  // 避免重复斜杠
  if (path.includes('//')) {
    return false
  }
  
  return true
}

/**
 * 生成组件名称（PascalCase）
 * @param name 原始名称
 * @returns PascalCase格式的组件名称
 */
export function generateComponentName(name: string): string {
  return name
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')
}

/**
 * 路由组件加载器
 * 根据路由路径动态加载对应的组件
 */
export function loadRouteComponent(path: string): () => Promise<any> {
  // 根路径使用主窗口模板
  if (path === '/') {
    return () => import('../components/template/main-window/MainWindowLayout.vue')
  }
  
  // 其他路径根据规则生成组件路径
  const pathParts = path.split('/').filter(Boolean)
  
  // 主窗口相关路由
  if (pathParts[0] === 'main') {
    const componentName = generateComponentName(pathParts[1] || '')
    return () => import(`../views/main-window/${componentName}.vue`)
  }
  
  // 项目根路由
  if (pathParts.length === 1) {
    // 所有项目都使用通用模板
    return () => import('../components/template/general/RegularLayout.vue')
  }
  
  // 项目子路由
  if (pathParts.length >= 2) {
    const projectName = pathParts[0]
    const componentName = generateComponentName(pathParts[1])
    return () => import(`../views/${projectName}/${componentName}.vue`)
  }
  
  // 默认返回404组件
  return () => import('../views/NotFound.vue')
}

/**
 * 转换数据库路由为Vue Router格式
 */
export function convertDbRoutesToVueRoutes(dbRoutes: any[]): RouteRecordRaw[] {
  return dbRoutes.map(dbRoute => {
    const routeConfig: any = {
      path: dbRoute.path,
      name: dbRoute.name,
      redirect: dbRoute.redirect,
      meta: {
        title: dbRoute.title || '',
        icon: dbRoute.icon,
        requiresAuth: dbRoute.requiresAuth !== false,
        permission: dbRoute.permission,
        keepAlive: dbRoute.keepAlive === true,
        showInMenu: dbRoute.showInMenu !== false,
        showInTabs: dbRoute.showInTabs !== false,
        order: dbRoute.order || 0
      }
    }
    
    // 添加调试日志
    console.log('Processing route:', dbRoute.path)
    
    // 根据路由路径动态生成组件导入路径
    // 1. 根路径使用主窗口模板
    if (dbRoute.path === '/') {
      routeConfig.component = loadRouteComponent(dbRoute.path)
      console.log('Layout component used for:', dbRoute.path, '../components/template/main-window/MainWindowLayout.vue')
    } 
    // 2. 项目根路由
    else if (!dbRoute.parentId) {
      // 所有项目根路由都使用通用项目模板
      routeConfig.component = loadRouteComponent(dbRoute.path)
      console.log('Layout component used for project:', dbRoute.path, '../components/template/general/RegularLayout.vue')
    } 
    // 3. 子路由或其他路由，根据路径生成对应的组件导入
    else {
      // 跳过布局组件的配置，只处理内容组件
      if (!dbRoute.redirect) {
        try {
          routeConfig.component = loadRouteComponent(dbRoute.path)
        } catch (error) {
          console.error('Error loading component for route:', dbRoute.path, error)
          // 提供一个默认组件，避免路由错误
          routeConfig.component = () => import('../views/NotFound.vue')
        }
      }
    }
    
    // 处理子路由
    if (dbRoute.children && dbRoute.children.length > 0) {
      routeConfig.children = convertDbRoutesToVueRoutes(dbRoute.children)
    }
    
    return routeConfig as RouteRecordRaw
  })
}
