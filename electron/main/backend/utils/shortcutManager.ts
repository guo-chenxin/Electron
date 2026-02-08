import { BrowserWindow } from 'electron'
import localShortcut from 'electron-localshortcut'
import log from 'electron-log'

// 快捷键配置接口
export interface ShortcutConfig {
  accelerator: string
  callback: () => void
  description?: string
}

// 快捷键管理类
export class ShortcutManager {
  private window: BrowserWindow | null = null
  private shortcuts: Map<string, ShortcutConfig> = new Map()
  private isInitialized = false

  /**
   * 设置目标窗口
   * @param window 要注册快捷键的窗口
   */
  setWindow(window: BrowserWindow | null): void {
    this.window = window
  }

  /**
   * 初始化快捷键
   */
  initialize(): void {
    try {
      if (!this.window) {
        log.warn('Cannot initialize shortcuts: no window set')
        return
      }

      // 注册默认快捷键
      this.registerDefaultShortcuts()
      
      this.isInitialized = true
      log.info('Keyboard shortcuts initialized successfully')
    } catch (error) {
      log.error('Failed to initialize shortcuts:', error)
    }
  }

  /**
   * 注册默认快捷键
   */
  private registerDefaultShortcuts(): void {
    if (!this.window) return

    // 开发者工具
    this.registerShortcut('Ctrl+Shift+I', () => {
      try {
        this.window?.webContents.openDevTools()
        log.info('Developer tools opened via shortcut')
      } catch (error) {
        log.error('Failed to open developer tools:', error)
      }
    }, '打开开发者工具')

    // 保存
    this.registerShortcut('Ctrl+S', () => {
      try {
        this.window?.webContents.send('shortcut:save')
        log.info('Save shortcut triggered')
      } catch (error) {
        log.error('Failed to trigger save shortcut:', error)
      }
    }, '保存')

    // 复制
    this.registerShortcut('Ctrl+C', () => {
      try {
        this.window?.webContents.send('shortcut:copy')
        log.info('Copy shortcut triggered')
      } catch (error) {
        log.error('Failed to trigger copy shortcut:', error)
      }
    }, '复制')

    // 粘贴
    this.registerShortcut('Ctrl+V', () => {
      try {
        this.window?.webContents.send('shortcut:paste')
        log.info('Paste shortcut triggered')
      } catch (error) {
        log.error('Failed to trigger paste shortcut:', error)
      }
    }, '粘贴')

    // 剪切
    this.registerShortcut('Ctrl+X', () => {
      try {
        this.window?.webContents.send('shortcut:cut')
        log.info('Cut shortcut triggered')
      } catch (error) {
        log.error('Failed to trigger cut shortcut:', error)
      }
    }, '剪切')

    // 全选
    this.registerShortcut('Ctrl+A', () => {
      try {
        this.window?.webContents.send('shortcut:select-all')
        log.info('Select all shortcut triggered')
      } catch (error) {
        log.error('Failed to trigger select-all shortcut:', error)
      }
    }, '全选')

    // 撤销
    this.registerShortcut('Ctrl+Z', () => {
      try {
        this.window?.webContents.send('shortcut:undo')
        log.info('Undo shortcut triggered')
      } catch (error) {
        log.error('Failed to trigger undo shortcut:', error)
      }
    }, '撤销')

    // 重做
    this.registerShortcut('Ctrl+Y', () => {
      try {
        this.window?.webContents.send('shortcut:redo')
        log.info('Redo shortcut triggered')
      } catch (error) {
        log.error('Failed to trigger redo shortcut:', error)
      }
    }, '重做')
  }

  /**
   * 注册快捷键
   * @param accelerator 快捷键组合
   * @param callback 回调函数
   * @param description 快捷键描述
   */
  registerShortcut(accelerator: string, callback: () => void, description?: string): void {
    try {
      if (!this.window) {
        log.warn(`Cannot register shortcut ${accelerator}: no window set`)
        return
      }

      // 先注销已有的相同快捷键
      this.unregisterShortcut(accelerator)

      // 注册新快捷键
      localShortcut.register(this.window, accelerator, callback)
      
      // 保存快捷键配置
      this.shortcuts.set(accelerator, {
        accelerator,
        callback,
        description
      })

      log.info(`Shortcut registered: ${accelerator}${description ? ` (${description})` : ''}`)
    } catch (error) {
      log.error(`Failed to register shortcut ${accelerator}:`, error)
    }
  }

  /**
   * 注销快捷键
   * @param accelerator 快捷键组合
   */
  unregisterShortcut(accelerator: string): void {
    try {
      if (!this.window) return

      localShortcut.unregister(this.window, accelerator)
      this.shortcuts.delete(accelerator)
      log.info(`Shortcut unregistered: ${accelerator}`)
    } catch (error) {
      log.error(`Failed to unregister shortcut ${accelerator}:`, error)
    }
  }

  /**
   * 注销所有快捷键
   */
  unregisterAll(): void {
    try {
      if (!this.window) return

      localShortcut.unregisterAll(this.window)
      this.shortcuts.clear()
      log.info('All shortcuts unregistered')
    } catch (error) {
      // 忽略错误，因为在窗口关闭后调用可能会出错
      log.info('Shortcut cleanup completed (errors ignored)')
    }
  }

  /**
   * 获取所有已注册的快捷键
   */
  getAllShortcuts(): ShortcutConfig[] {
    return Array.from(this.shortcuts.values())
  }

  /**
   * 检查快捷键是否已注册
   * @param accelerator 快捷键组合
   */
  isRegistered(accelerator: string): boolean {
    return this.shortcuts.has(accelerator)
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    try {
      this.unregisterAll()
      this.window = null
      this.isInitialized = false
      log.info('Shortcut manager cleanup completed')
    } catch (error) {
      // 忽略错误，因为在窗口关闭后调用可能会出错
      log.info('Shortcut manager cleanup completed (errors ignored)')
    }
  }
}
