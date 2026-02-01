import { ref } from 'vue'

/**
 * 窗口管理
 * 提供创建和管理次级窗口的功能
 */
export function useWindowManager() {
  // 次级窗口列表
  const secondaryWindows = ref<string[]>([])

  /**
   * 创建次级窗口
   * @param windowId 窗口唯一标识
   * @param options 窗口配置选项
   */
  const createSecondaryWindow = async (
    windowId: string,
    options: {
      title: string
      route: string
      width?: number
      height?: number
      minWidth?: number
      minHeight?: number
    }
  ) => {
    try {
      const result = await window.electronAPI.invoke('window:create-secondary', windowId, options)
      if (result.success) {
        // 刷新窗口列表
        await refreshSecondaryWindows()
      }
      return result
    } catch (error) {
      console.error('Failed to create secondary window:', error)
      return { success: false, error: (error as Error).message }
    }
  }

  /**
   * 关闭次级窗口
   * @param windowId 窗口唯一标识
   */
  const closeSecondaryWindow = async (windowId: string) => {
    try {
      const result = await window.electronAPI.invoke('window:close-secondary', windowId)
      if (result.success) {
        // 刷新窗口列表
        await refreshSecondaryWindows()
      }
      return result
    } catch (error) {
      console.error('Failed to close secondary window:', error)
      return { success: false, error: (error as Error).message }
    }
  }

  /**
   * 关闭所有次级窗口
   */
  const closeAllSecondaryWindows = async () => {
    try {
      const result = await window.electronAPI.invoke('window:close-all-secondary')
      if (result.success) {
        // 刷新窗口列表
        await refreshSecondaryWindows()
      }
      return result
    } catch (error) {
      console.error('Failed to close all secondary windows:', error)
      return { success: false, error: (error as Error).message }
    }
  }

  /**
   * 刷新次级窗口列表
   */
  const refreshSecondaryWindows = async () => {
    try {
      const windows = await window.electronAPI.invoke<string[]>('window:get-all-secondary')
      secondaryWindows.value = windows
    } catch (error) {
      console.error('Failed to refresh secondary windows:', error)
      secondaryWindows.value = []
    }
  }

  // 初始化时刷新窗口列表
  refreshSecondaryWindows()

  return {
    secondaryWindows,
    createSecondaryWindow,
    closeSecondaryWindow,
    closeAllSecondaryWindows,
    refreshSecondaryWindows
  }
}

/**
 * 打开功能窗口
 * 提供便捷的功能窗口打开方法
 */
export function useFeatureWindows() {
  const { createSecondaryWindow } = useWindowManager()

  /**
   * 打开设置窗口
   */
  const openSettingsWindow = async () => {
    return createSecondaryWindow('settings', {
      title: '设置',
      route: '/settings',
      width: 800,
      height: 600,
      minWidth: 600,
      minHeight: 400
    })
  }

  /**
   * 打开关于窗口
   */
  const openAboutWindow = async () => {
    return createSecondaryWindow('about', {
      title: '关于',
      route: '/about',
      width: 600,
      height: 400,
      minWidth: 500,
      minHeight: 300
    })
  }

  /**
   * 打开帮助窗口
   */
  const openHelpWindow = async () => {
    return createSecondaryWindow('help', {
      title: '帮助',
      route: '/help',
      width: 900,
      height: 700,
      minWidth: 700,
      minHeight: 500
    })
  }

  return {
    openSettingsWindow,
    openAboutWindow,
    openHelpWindow
  }
}
