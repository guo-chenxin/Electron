import { app, BrowserWindow } from 'electron'
import log from 'electron-log'
import isDev from 'electron-is-dev'
import { installExtension, VUEJS_DEVTOOLS } from 'electron-devtools-installer'
import { WindowManager } from './windowManager'
import { ShortcutManager } from './shortcutManager'

// 应用生命周期管理类
export class LifecycleManager {
  private windowManager: WindowManager
  private shortcutManager: ShortcutManager
  private db: any
  private apiManager: any

  constructor(windowManager: WindowManager, shortcutManager: ShortcutManager) {
    this.windowManager = windowManager
    this.shortcutManager = shortcutManager
  }

  /**
   * 设置数据库实例
   * @param dbInstance 数据库实例
   */
  setDatabase(dbInstance: any): void {
    this.db = dbInstance
  }

  /**
   * 设置API管理器实例
   * @param apiManagerInstance API管理器实例
   */
  setApiManager(apiManagerInstance: any): void {
    this.apiManager = apiManagerInstance
  }

  /**
   * 初始化应用生命周期事件
   */
  initialize(): void {
    try {
      // 注册应用生命周期事件
      this.registerLifecycleEvents()
      log.info('Application lifecycle events registered successfully')
    } catch (error) {
      log.error('Failed to register lifecycle events:', error)
    }
  }

  /**
   * 注册应用生命周期事件
   */
  private registerLifecycleEvents(): void {
    // 应用就绪事件
    app.whenReady().then(async () => {
      await this.handleAppReady()
    })

    // 所有窗口关闭事件
    app.on('window-all-closed', () => {
      this.handleWindowAllClosed()
    })

    // 第二个实例事件
    app.on('second-instance', () => {
      this.handleSecondInstance()
    })

    // 应用激活事件
    app.on('activate', () => {
      this.handleAppActivate()
    })

    // 应用退出前事件
    app.on('before-quit', async () => {
      await this.handleBeforeQuit()
    })
  }

  /**
   * 处理应用就绪事件
   */
  private async handleAppReady(): Promise<void> {
    try {
      log.info('Starting backend initialization...')
      
      // 开发环境安装Vue DevTools
      if (isDev) {
        try {
          await installExtension(VUEJS_DEVTOOLS)
          log.info('Vue DevTools installed successfully')
        } catch (error) {
          log.error('Failed to install Vue DevTools:', error)
        }
      }
      
      // 初始化数据库
      try {
        if (this.db) {
          await this.db.connect()
          await this.db.initialize()
          log.info('Database initialization completed successfully')
        }
      } catch (error) {
        log.error('Database initialization failed:', error)
        // 数据库初始化失败时仍然继续启动应用
      }
      
      // 初始化API路由
      try {
        if (this.apiManager) {
          this.apiManager.initialize()
          log.info('API routes initialization completed successfully')
        }
      } catch (error) {
        log.error('API routes initialization failed:', error)
        // API初始化失败时仍然继续启动应用
      }
      
      // 初始化预定义路由
      try {
        const { seedInitialRoutes } = await import('../db/seedRoutes')
        await seedInitialRoutes()
        log.info('Initial routes seeded successfully')
      } catch (error) {
        log.error('Initial routes seeding failed:', error)
        // 路由初始化失败时仍然继续启动应用
      }
      
      // 创建主窗口
      const mainWindow = await this.windowManager.createMainWindow()
      
      // 注册本地快捷键
      if (mainWindow) {
        this.shortcutManager.setWindow(mainWindow)
        this.shortcutManager.initialize()
      }
      
      log.info('Application started successfully')
    } catch (error) {
      log.error('Backend initialization failed:', error)
    }
  }

  /**
   * 处理所有窗口关闭事件
   */
  private handleWindowAllClosed(): void {
    try {
      // 清理窗口引用
      this.windowManager.closeAllSecondaryWindows()
      log.info('All windows closed and cleaned up')
      
      if (process.platform !== 'darwin') {
        app.quit()
      }
    } catch (error) {
      log.error('Error during window-all-closed event:', error)
    }
  }

  /**
   * 处理第二个实例事件
   */
  private handleSecondInstance(): void {
    try {
      const mainWindow = this.windowManager.getMainWindow()
      if (mainWindow) {
        // Focus on the main window if the user tried to open another
        if (mainWindow.isMinimized()) {
          mainWindow.restore()
        }
        mainWindow.focus()
        log.info('Second instance detected, main window focused')
      }
    } catch (error) {
      log.error('Error during second-instance event:', error)
    }
  }

  /**
   * 处理应用激活事件
   */
  private handleAppActivate(): void {
    try {
      const allWindows = BrowserWindow.getAllWindows()
      if (allWindows.length) {
        allWindows[0].focus()
        log.info('Application activated, window focused')
      } else {
        this.windowManager.createMainWindow()
        log.info('Application activated, creating new main window')
      }
    } catch (error) {
      log.error('Error during activate event:', error)
    }
  }

  /**
   * 处理应用退出前事件
   */
  private async handleBeforeQuit(): Promise<void> {
    try {
      log.info('Application shutting down...')
      
      // 清理所有快捷键
      try {
        this.shortcutManager.cleanup()
        log.info('Keyboard shortcuts unregistered')
      } catch (error) {
        // 忽略清理快捷键时的错误
        log.info('Shortcut cleanup ignored:', error)
      }
      
      // 关闭数据库连接
      try {
        if (this.db) {
          await this.db.close()
          log.info('Database connection closed on app exit')
        }
      } catch (error) {
        log.error('Failed to close database connection on app exit:', error)
      }
      
      // 清理所有次级窗口
      try {
        this.windowManager.closeAllSecondaryWindows()
        log.info('All secondary windows cleaned up')
      } catch (error) {
        log.error('Failed to clean up secondary windows:', error)
      }
      
      log.info('Application shutdown completed')
    } catch (error) {
      log.error('Error during application shutdown:', error)
    }
  }
}
