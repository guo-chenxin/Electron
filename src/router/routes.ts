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
 * 简化的静态路由（用于 index.ts 中）
 */
export const simplifiedStaticRoutes: RouteRecordRaw[] = [
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
    alwaysShow?: boolean
    order?: number
  }
  children?: AppRouteRecordRaw[]
}

/**
 * 路由组件加载器
 * 根据路由路径动态加载对应的组件
 */
export function loadRouteComponent(path: string): () => Promise<any> {
  // 根路径使用主窗口模板
  if (path === '/') {
    return () => import('../components/main-window-template/MainWindowLayout.vue')
  }
  
  // 其他路径根据规则生成组件路径
  const pathParts = path.split('/').filter(Boolean)
  
  // 主窗口相关路由
  if (pathParts[0] === 'main') {
    const componentName = pathParts[1]
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('')
    return () => import(`../views/main-window/${componentName}.vue`)
  }
  
  // 项目根路由
  if (pathParts.length === 1) {
    const projectName = pathParts[0]
    // 这里可以根据后端提供的项目类型或路由配置来决定使用哪种布局
    // 暂时根据项目名称判断，后续可以通过API获取更准确的信息
    // 检查是否为其他项目（无菜单）
    const isOtherProject = false; // 默认为常规项目
    
    try {
      if (isOtherProject) {
        return () => import('../components/other-project-template/OtherProjectLayout.vue')
      } else {
        return () => import('../components/regular-project-template/RegularLayout.vue')
      }
    } catch (error) {
      console.error(`Failed to load project layout:`, error)
      return () => import('../views/NotFound.vue')
    }
  }
  
  // 项目子路由
  if (pathParts.length >= 2) {
    const projectName = pathParts[0]
    const componentName = pathParts[1]
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('')
    
    try {
      return () => import(`../views/project/${projectName}/${componentName}.vue`)
    } catch (error) {
      console.error(`Failed to load project component:`, error)
      return () => import('../views/NotFound.vue')
    }
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
        alwaysShow: dbRoute.alwaysShow === true,
        order: dbRoute.order || 0
      }
    }
    
    // 添加调试日志
    console.log('Processing route:', dbRoute.path)
    
    // 根据路由路径动态生成组件导入路径
    // 1. 根路径使用主窗口模板
    if (dbRoute.path === '/') {
      routeConfig.component = () => import('../components/main-window-template/MainWindowLayout.vue')
      console.log('Layout component used for:', dbRoute.path, '../components/main-window-template/MainWindowLayout.vue')
      
      // 设置默认重定向，确保右侧有内容显示
      if (!dbRoute.redirect) {
        routeConfig.redirect = '/main/all-projects'
        console.log('Default redirect set for root route:', '/main/all-projects')
      }
    } 
    // 2. 常规项目根路由（有菜单项）
    else if (dbRoute.projectType === 'regular' && !dbRoute.parentId) {
      // 所有常规项目根路由都使用常规项目模板
      routeConfig.component = () => import('../components/regular-project-template/RegularLayout.vue')
      console.log('Layout component used for regular project:', dbRoute.path, '../components/regular-project-template/RegularLayout.vue')
      
      // 设置默认重定向，确保右侧有内容显示
      if (!dbRoute.redirect) {
        const defaultRedirect = `${dbRoute.path}/home`
        routeConfig.redirect = defaultRedirect
        console.log('Default redirect set for regular project:', dbRoute.path, '->', defaultRedirect)
      }
    } 
    // 3. 其他项目根路由（无菜单项）
    else if (dbRoute.projectType === 'other' && !dbRoute.parentId) {
      // 所有其他项目根路由都使用其他项目模板
      routeConfig.component = () => import('../components/other-project-template/OtherProjectLayout.vue')
      console.log('Layout component used for other project:', dbRoute.path, '../components/other-project-template/OtherProjectLayout.vue')
      
      // 设置默认重定向，确保右侧有内容显示
      if (!dbRoute.redirect) {
        const defaultRedirect = `${dbRoute.path}/home`
        routeConfig.redirect = defaultRedirect
        console.log('Default redirect set for other project:', dbRoute.path, '->', defaultRedirect)
      }
    } 
    // 4. 子路由或其他路由，根据路径生成对应的组件导入
    else {
      // 跳过布局组件的配置，只处理内容组件
      if (!dbRoute.redirect) {
        // 根据路由路径生成组件文件路径
        let importPath = ''
        
        // 1. 主窗口相关路由 (/main/xxx)
        if (dbRoute.path.startsWith('/main/')) {
          // 提取路由名称，如 /main/all-projects -> all-projects
          const routeName = dbRoute.path.slice(6) // 移除 /main/
          // 转换为 PascalCase，如 all-projects -> AllProjects
          const componentName = routeName.replace(/(^|-)(\w)/g, (match: string, separator: string, letter: string) => letter.toUpperCase())
          importPath = `../views/main-window/${componentName}.vue`
        }
        // 2. 常规项目子路由 (/projectName/xxx)
        else if (dbRoute.projectType === 'regular' && dbRoute.parentId) {
          // 提取项目名称和路由名称，如 /blog/home -> blog, home
          const pathParts = dbRoute.path.split('/').filter(Boolean)
          if (pathParts.length >= 2) {
            const projectName = pathParts[0]
            const routeName = pathParts[1]
            // 组件在 project/{projectName}/ 目录下
            importPath = `../views/project/${projectName}/${routeName.charAt(0).toUpperCase() + routeName.slice(1)}.vue`
          } else {
            // 路径格式不正确，使用默认组件
            importPath = '../views/DefaultView.vue'
          }
        }
        // 3. 其他项目子路由 (/projectName/xxx)
        else if (dbRoute.projectType === 'other' && dbRoute.parentId) {
          // 提取项目名称和路由名称，如 /music/home -> music, home
          const pathParts = dbRoute.path.split('/').filter(Boolean)
          if (pathParts.length >= 2) {
            const projectName = pathParts[0]
            const routeName = pathParts[1]
            // 组件在 other/{projectName}/ 目录下
            importPath = `../views/other/${projectName}/${routeName.charAt(0).toUpperCase() + routeName.slice(1)}.vue`
          } else {
            // 路径格式不正确，使用默认组件
            importPath = '../views/DefaultView.vue'
          }
        }
        // 4. 其他路由
        else {
          // 提供一个默认组件，避免路由错误
          importPath = '../views/DefaultView.vue'
        }
        
        console.log('Content component used for:', dbRoute.path, importPath)
        
        try {
          routeConfig.component = () => import(importPath)
        } catch (error) {
          console.error('Error importing component:', importPath, error)
          // 提供一个默认组件，避免路由错误
          routeConfig.component = () => import('../views/DefaultView.vue')
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
