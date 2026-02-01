import { ref, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

/**
 * 路由状态管理
 * 实现路由状态的持久化和会话恢复
 */
export function useRouteState() {
  const router = useRouter()
  const route = useRoute()
  
  // 路由历史记录
  const routeHistory = ref<string[]>([])
  
  // 当前激活的菜单项
  const activeMenu = ref<string>('')
  
  // 保存路由状态到本地存储
  const saveRouteState = () => {
    const state = {
      currentRoute: route.path,
      routeHistory: routeHistory.value,
      activeMenu: activeMenu.value,
      timestamp: Date.now()
    }
    
    try {
      localStorage.setItem('routeState', JSON.stringify(state))
    } catch (error) {
      console.error('Failed to save route state:', error)
    }
  }
  
  // 从本地存储恢复路由状态
  const restoreRouteState = () => {
    try {
      const savedState = localStorage.getItem('routeState')
      if (savedState) {
        const state = JSON.parse(savedState)
        
        // 检查状态是否有效（不超过7天）
        const now = Date.now()
        const sevenDays = 7 * 24 * 60 * 60 * 1000
        
        if (state.timestamp && (now - state.timestamp) < sevenDays) {
          // 恢复路由历史
          if (state.routeHistory) {
            routeHistory.value = state.routeHistory
          }
          
          // 恢复激活的菜单项
          if (state.activeMenu) {
            activeMenu.value = state.activeMenu
          }
          
          // 恢复当前路由
          if (state.currentRoute && state.currentRoute !== route.path) {
            // 延迟导航，确保路由已加载
            setTimeout(() => {
              router.replace(state.currentRoute)
            }, 100)
          }
        }
      }
    } catch (error) {
      console.error('Failed to restore route state:', error)
    }
  }
  
  // 添加路由到历史记录
  const addToRouteHistory = (path: string) => {
    // 移除已存在的相同路径
    const index = routeHistory.value.indexOf(path)
    if (index > -1) {
      routeHistory.value.splice(index, 1)
    }
    
    // 添加到历史记录开头
    routeHistory.value.unshift(path)
    
    // 限制历史记录长度
    if (routeHistory.value.length > 20) {
      routeHistory.value = routeHistory.value.slice(0, 20)
    }
    
    // 保存状态
    saveRouteState()
  }
  
  // 清空路由历史记录
  const clearRouteHistory = () => {
    routeHistory.value = []
    saveRouteState()
  }
  
  // 监听路由变化，更新状态
  watch(
    () => route.path,
    (newPath) => {
      activeMenu.value = newPath
      addToRouteHistory(newPath)
    },
    { immediate: true }
  )
  
  // 应用启动时恢复路由状态
  onMounted(() => {
    restoreRouteState()
  })
  
  return {
    routeHistory,
    activeMenu,
    saveRouteState,
    restoreRouteState,
    addToRouteHistory,
    clearRouteHistory
  }
}
