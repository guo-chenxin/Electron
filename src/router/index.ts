import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'
import { baseStaticRoutes, convertDbRoutesToVueRoutes } from './routes'

// 创建路由实例
const router = createRouter({
  history: createWebHashHistory(),
  routes: baseStaticRoutes
})

// 路由加载状态
let isRoutesLoaded = false

// 动态加载路由函数
export async function loadDynamicRoutes() {
  try {
    // 清除现有的动态路由（保留静态路由）
    const staticRouteNames = baseStaticRoutes.map(route => route.name)
    router.getRoutes().forEach(route => {
      if (route.name && !staticRouteNames.includes(route.name)) {
        router.removeRoute(route.name)
      }
    })
    
    // 检查window.electronAPI是否存在
    if (!window.electronAPI) {
      console.warn('window.electronAPI is not available, using static routes only');
      isRoutesLoaded = true;
      return;
    }
    
    // 从主进程获取路由配置
    const routesFromDb = await window.electronAPI.invoke<any[]>('api:routes:getAllNested')
    

    
    // 将数据库路由转换为Vue Router格式
    const dynamicRoutes = convertDbRoutesToVueRoutes(routesFromDb)
    
    // 添加动态路由到路由实例
    dynamicRoutes.forEach(route => {
      router.addRoute(route)
    })
    
    isRoutesLoaded = true

    
    // 如果当前路由是404，重定向到首页
    if (router.currentRoute.value.path === '/404') {
      router.replace('/')
    }
  } catch (error) {
    console.error('Failed to load dynamic routes:', error)
    isRoutesLoaded = true // 即使加载失败，也标记为已加载，避免无限循环
  }
}

// 路由导航守卫
router.beforeEach(async (to, from, next) => {
  // 获取路由的requiresAuth属性，默认为true
  const requiresAuth = to.meta.requiresAuth !== false
  
  // 允许访问不需要认证的路由
  if (!requiresAuth) {
    next()
    return
  }
  
  // 检查登录状态，优先使用localStorage中的认证信息
  const isLoggedIn = localStorage.getItem('userInfo') !== null
  if (!isLoggedIn) {
    next('/login')
    return
  }
  
  // 加载动态路由
  if (!isRoutesLoaded) {
    await loadDynamicRoutes()
    // 路由加载完成后，重新导航到目标路由
    next({ ...to, replace: true })
    return
  }
  
  // 已登录，且路由已加载，放行
  next()
})

// 导出路由实例
export default router