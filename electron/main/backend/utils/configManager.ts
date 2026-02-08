import Store from 'electron-store'
import log from 'electron-log'

// 应用配置类型定义
export interface AppConfig {
  theme: 'light' | 'dark'
  language: string
  window: {
    defaultWidth: number
    defaultHeight: number
    isMaximized: boolean
  }
  preferences: {
    autoUpdate: boolean
    showNotifications: boolean
    developerMode: boolean
  }
}

// 集中管理默认配置
const DEFAULT_CONFIG: AppConfig = {
  theme: 'light',
  language: 'zh-CN',
  window: {
    defaultWidth: 1000,
    defaultHeight: 700,
    isMaximized: false
  },
  preferences: {
    autoUpdate: true,
    showNotifications: true,
    developerMode: false
  }
}

/**
 * 通用错误处理函数
 * @param operation 操作描述
 * @param error 错误对象
 * @param fallback 默认返回值
 * @returns 默认返回值
 */
function handleConfigError<T>(operation: string, error: any, fallback: T): T {
  log.error(`Failed to ${operation}:`, error)
  return fallback
}

/**
 * 配置管理类
 * 提供应用配置的读写操作
 */
export class ConfigManager {
  private store: Store<AppConfig>

  constructor() {
    this.store = new Store<AppConfig>({
      defaults: DEFAULT_CONFIG
    })
  }

  /**
   * 获取所有配置
   */
  getAll(): AppConfig {
    try {
      return this.store.store
    } catch (error) {
      return handleConfigError('get all config', error, DEFAULT_CONFIG)
    }
  }

  /**
   * 获取指定配置项
   * @param key 配置键路径
   */
  get<T = any>(key: string): T {
    try {
      return this.store.get(key as any) as T
    } catch (error) {
      return handleConfigError(`get config for key ${key}`, error, undefined as T)
    }
  }

  /**
   * 设置配置项
   * @param key 配置键路径
   * @param value 配置值
   */
  set<T = any>(key: string, value: T): void {
    try {
      this.store.set(key as any, value)
      log.debug(`Config set for key ${key}:`, value)
    } catch (error) {
      handleConfigError(`set config for key ${key}`, error, undefined)
    }
  }

  /**
   * 删除配置项
   * @param key 配置键路径
   */
  delete(key: string): void {
    try {
      this.store.delete(key as any)
      log.debug(`Config deleted for key ${key}`)
    } catch (error) {
      handleConfigError(`delete config for key ${key}`, error, undefined)
    }
  }

  /**
   * 重置所有配置为默认值
   */
  reset(): void {
    try {
      this.store.clear()
      log.info('All config reset to defaults')
    } catch (error) {
      handleConfigError('reset config', error, undefined)
    }
  }

  /**
   * 检查配置项是否存在
   * @param key 配置键路径
   */
  has(key: string): boolean {
    try {
      return this.store.has(key as any)
    } catch (error) {
      return handleConfigError(`check config for key ${key}`, error, false)
    }
  }

  /**
   * 主题相关配置
   */
  get theme() {
    const self = this
    return {
      /**
       * 获取当前主题
       */
      get(): 'light' | 'dark' {
        try {
          return self.store.get('theme')
        } catch (error) {
          return handleConfigError('get theme', error, DEFAULT_CONFIG.theme)
        }
      },

      /**
       * 设置主题
       * @param theme 主题名称
       */
      set(theme: 'light' | 'dark'): void {
        try {
          self.store.set('theme', theme)
          log.info(`Theme set to ${theme}`)
        } catch (error) {
          handleConfigError(`set theme to ${theme}`, error, undefined)
        }
      },

      /**
       * 切换主题
       */
      toggle(): 'light' | 'dark' {
        try {
          const currentTheme = self.store.get('theme')
          const newTheme = currentTheme === 'light' ? 'dark' : 'light'
          self.store.set('theme', newTheme)
          log.info(`Theme toggled to ${newTheme}`)
          return newTheme
        } catch (error) {
          return handleConfigError('toggle theme', error, DEFAULT_CONFIG.theme)
        }
      }
    }
  }

  /**
   * 窗口相关配置
   */
  get window() {
    const self = this
    return {
      /**
       * 获取窗口默认大小
       */
      getDefaultSize(): { width: number; height: number } {
        try {
          const windowConfig = self.store.get('window')
          return {
            width: windowConfig.defaultWidth,
            height: windowConfig.defaultHeight
          }
        } catch (error) {
          return handleConfigError('get window default size', error, {
            width: DEFAULT_CONFIG.window.defaultWidth,
            height: DEFAULT_CONFIG.window.defaultHeight
          })
        }
      },

      /**
       * 设置窗口默认大小
       * @param width 宽度
       * @param height 高度
       */
      setDefaultSize(width: number, height: number): void {
        try {
          self.store.set('window.defaultWidth', width)
          self.store.set('window.defaultHeight', height)
          log.info(`Window default size set to ${width}x${height}`)
        } catch (error) {
          handleConfigError('set window default size', error, undefined)
        }
      },

      /**
       * 设置窗口大小
       * @param size 窗口大小
       */
      setSize(size: { width: number; height: number }): void {
        try {
          self.store.set('window.defaultWidth', size.width)
          self.store.set('window.defaultHeight', size.height)
          log.debug(`Window size set to ${size.width}x${size.height}`)
        } catch (error) {
          handleConfigError('set window size', error, undefined)
        }
      },

      /**
       * 获取窗口最大化状态
       */
      getIsMaximized(): boolean {
        try {
          return self.store.get('window.isMaximized')
        } catch (error) {
          return handleConfigError('get window maximized state', error, DEFAULT_CONFIG.window.isMaximized)
        }
      },

      /**
       * 设置窗口最大化状态
       * @param isMaximized 是否最大化
       */
      setIsMaximized(isMaximized: boolean): void {
        try {
          self.store.set('window.isMaximized', isMaximized)
          log.debug(`Window maximized state set to ${isMaximized}`)
        } catch (error) {
          handleConfigError('set window maximized state', error, undefined)
        }
      }
    }
  }

  /**
   * 偏好设置相关配置
   */
  get preferences() {
    const self = this
    return {
      /**
       * 获取自动更新设置
       */
      getAutoUpdate(): boolean {
        try {
          return self.store.get('preferences.autoUpdate')
        } catch (error) {
          return handleConfigError('get autoUpdate preference', error, DEFAULT_CONFIG.preferences.autoUpdate)
        }
      },

      /**
       * 设置自动更新
       * @param enabled 是否启用
       */
      setAutoUpdate(enabled: boolean): void {
        try {
          self.store.set('preferences.autoUpdate', enabled)
          log.info(`Auto update set to ${enabled}`)
        } catch (error) {
          handleConfigError(`set auto update to ${enabled}`, error, undefined)
        }
      },

      /**
       * 获取通知设置
       */
      getShowNotifications(): boolean {
        try {
          return self.store.get('preferences.showNotifications')
        } catch (error) {
          return handleConfigError('get showNotifications preference', error, DEFAULT_CONFIG.preferences.showNotifications)
        }
      },

      /**
       * 设置通知
       * @param enabled 是否启用
       */
      setShowNotifications(enabled: boolean): void {
        try {
          self.store.set('preferences.showNotifications', enabled)
          log.info(`Show notifications set to ${enabled}`)
        } catch (error) {
          handleConfigError(`set show notifications to ${enabled}`, error, undefined)
        }
      },

      /**
       * 获取开发者模式设置
       */
      getDeveloperMode(): boolean {
        try {
          return self.store.get('preferences.developerMode')
        } catch (error) {
          return handleConfigError('get developerMode preference', error, DEFAULT_CONFIG.preferences.developerMode)
        }
      },

      /**
       * 设置开发者模式
       * @param enabled 是否启用
       */
      setDeveloperMode(enabled: boolean): void {
        try {
          self.store.set('preferences.developerMode', enabled)
          log.info(`Developer mode set to ${enabled}`)
        } catch (error) {
          handleConfigError(`set developer mode to ${enabled}`, error, undefined)
        }
      }
    }
  }
}

// 创建并导出配置管理实例
const configManagerInstance = new ConfigManager()
export default configManagerInstance

// 保持向后兼容性
export const configManager = configManagerInstance
