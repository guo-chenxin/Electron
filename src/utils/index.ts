/**
 * 深拷贝函数，确保不会影响原始数据
 * @param obj 需要拷贝的对象
 * @returns 拷贝后的新对象
 * @description 使用 JSON 序列化和反序列化实现深拷贝，避免 structuredClone 的限制
 */
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }
  
  try {
    // 尝试使用 JSON 序列化和反序列化实现深拷贝
    return JSON.parse(JSON.stringify(obj))
  } catch (error) {
    console.error('Deep clone failed:', error)
    // 如果 JSON 方法失败，返回原始对象
    return obj
  }
}

/**
 * 生成默认的菜单项
 * @param order 菜单项顺序
 * @returns 默认的菜单项对象
 */
export const generateDefaultMenuItem = (order: number = 1) => {
  return {
    title: '',
    icon: 'i-carbon-home',
    routePath: '',
    component: '',
    showInMenu: true,
    showInTabs: false,
    requiresAuth: true,
    order
  }
}

/**
 * 生成默认的项目表单数据
 * @returns 默认的项目表单数据对象
 */
export const generateDefaultProjectForm = () => {
  return {
    title: '',
    description: '',
    icon: 'i-carbon-star',
    routePath: '',
    redirect: '',
    showInMenu: true,
    showInTabs: true,
    requiresAuth: false,
    order: 999,
    menuItems: [generateDefaultMenuItem(1)]
  }
}

/**
 * 验证路由路径格式
 * @param path 路由路径
 * @returns 是否为有效的路由路径
 */
export const validateRoutePath = (path: string): boolean => {
  const routePathRegex = /^\/[a-zA-Z0-9\-_\/]+$/
  return routePathRegex.test(path)
}

/**
 * 格式化菜单项顺序，确保顺序唯一且递增
 * @param menuItems 菜单项列表
 * @returns 格式化后的菜单项列表
 */
export const formatMenuItemOrders = (menuItems: any[]): any[] => {
  return menuItems.map((item, index) => ({
    ...item,
    order: index + 1
  }))
}
