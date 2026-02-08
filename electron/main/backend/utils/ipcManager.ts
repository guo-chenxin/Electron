import { ipcMain } from 'electron'
import log from 'electron-log'
import { WindowManager, SecondaryWindowOptions, IpcResponse } from './windowManager'

// IPC事件处理类
export class IpcManager {
  private windowManager: WindowManager

  constructor(windowManager: WindowManager) {
    this.windowManager = windowManager
  }

  /**
   * 初始化IPC事件处理
   */
  initialize(): void {
    try {
      // 注册窗口控制事件
      this.registerWindowControlEvents()
      
      // 注册多窗口相关事件
      this.registerMultiWindowEvents()
      
      // 注册上下文菜单事件
      this.registerContextMenuEvents()
      
      log.info('IPC events registered successfully')
    } catch (error) {
      log.error('Failed to register IPC events:', error)
    }
  }
  
  /**
   * 注册上下文菜单事件
   */
  private registerContextMenuEvents(): void {
    // 显示卡片右键菜单
    ipcMain.handle('context-menu:show-card-menu', () => {
      try {
        const mainWindow = this.windowManager.getMainWindow()
        if (mainWindow) {
          this.windowManager.showCardContextMenu(mainWindow)
          return { success: true }
        }
        return { success: false, error: 'Main window not found' }
      } catch (error: any) {
        log.error('Failed to handle context-menu:show-card-menu event:', error)
        return { success: false, error: error.message }
      }
    })
  }

  /**
   * 注册窗口控制事件
   */
  private registerWindowControlEvents(): void {
    // 最小化窗口
    ipcMain.on('window-minimize', () => {
      try {
        this.windowManager.minimizeMainWindow()
      } catch (error) {
        log.error('Failed to handle window-minimize event:', error)
      }
    })

    // 最大化/还原窗口
    ipcMain.on('window-maximize', () => {
      try {
        this.windowManager.toggleMaximizeMainWindow()
      } catch (error) {
        log.error('Failed to handle window-maximize event:', error)
      }
    })

    // 切换窗口置顶
    ipcMain.on('window-toggle-pin', () => {
      try {
        this.windowManager.toggleAlwaysOnTop()
      } catch (error) {
        log.error('Failed to handle window-toggle-pin event:', error)
      }
    })

    // 关闭窗口
    ipcMain.on('window-close', () => {
      try {
        this.windowManager.closeMainWindow()
      } catch (error) {
        log.error('Failed to handle window-close event:', error)
      }
    })
  }

  /**
   * 注册多窗口相关事件
   */
  private registerMultiWindowEvents(): void {
    // 创建次级窗口
    ipcMain.handle('window:create-secondary', (_: Electron.IpcMainInvokeEvent, windowId: string, options: SecondaryWindowOptions): IpcResponse => {
      try {
        const win = this.windowManager.createSecondaryWindow(windowId, options)
        if (win) {
          return { success: true }
        }
        return { success: false, error: 'Failed to create window' }
      } catch (error: any) {
        log.error('Failed to handle window:create-secondary event:', error)
        return { success: false, error: error.message }
      }
    })

    // 关闭次级窗口
    ipcMain.handle('window:close-secondary', (_: Electron.IpcMainInvokeEvent, windowId: string): IpcResponse => {
      try {
        const success = this.windowManager.closeSecondaryWindow(windowId)
        return { success }
      } catch (error: any) {
        log.error('Failed to handle window:close-secondary event:', error)
        return { success: false, error: error.message }
      }
    })

    // 关闭所有次级窗口
    ipcMain.handle('window:close-all-secondary', (): IpcResponse => {
      try {
        this.windowManager.closeAllSecondaryWindows()
        return { success: true }
      } catch (error: any) {
        log.error('Failed to handle window:close-all-secondary event:', error)
        return { success: false, error: error.message }
      }
    })

    // 获取所有次级窗口
    ipcMain.handle('window:get-all-secondary', (): string[] => {
      try {
        return this.windowManager.getAllSecondaryWindowIds()
      } catch (error) {
        log.error('Failed to handle window:get-all-secondary event:', error)
        return []
      }
    })
  }

  /**
   * 注册自定义IPC事件
   * @param channel 事件通道
   * @param handler 事件处理函数
   */
  registerCustomEvent(channel: string, handler: (...args: any[]) => void): void {
    try {
      ipcMain.on(channel, handler)
      log.info(`Custom IPC event registered: ${channel}`)
    } catch (error) {
      log.error(`Failed to register custom IPC event ${channel}:`, error)
    }
  }

  /**
   * 注册自定义IPC处理函数
   * @param channel 事件通道
   * @param handler 事件处理函数
   */
  registerCustomHandler<T>(channel: string, handler: (...args: any[]) => T): void {
    try {
      ipcMain.handle(channel, handler)
      log.info(`Custom IPC handler registered: ${channel}`)
    } catch (error) {
      log.error(`Failed to register custom IPC handler ${channel}:`, error)
    }
  }

  /**
   * 清理IPC事件
   */
  cleanup(): void {
    try {
      // 注意：ipcMain.removeAllListeners() 会移除所有IPC事件监听器
      // 包括其他模块注册的事件，所以我们不在这里调用
      // 每个模块应该负责清理自己注册的事件
      log.info('IPC manager cleanup completed')
    } catch (error) {
      log.error('Failed to cleanup IPC manager:', error)
    }
  }
}
