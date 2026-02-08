import { BrowserWindow, screen, shell, Menu } from 'electron'
import path from 'node:path'
import log from 'electron-log'
import { configManager } from './configManager'
import isDev from 'electron-is-dev'

// 类型定义
export interface WindowSize {
  width: number
  height: number
}

export interface SecondaryWindowOptions {
  title?: string
  width?: number
  height?: number
  minWidth?: number
  minHeight?: number
  route: string
}

export interface IpcResponse {
  success: boolean
  error?: string
}

// 窗口管理类
export class WindowManager {
  private mainWindow: BrowserWindow | null = null
  private secondaryWindows: Map<string, BrowserWindow> = new Map()
  private preload: string
  private indexHtml: string
  private viteDevServerUrl: string | undefined

  constructor(preloadPath: string, indexHtmlPath: string, viteDevServerUrl?: string) {
    this.preload = preloadPath
    this.indexHtml = indexHtmlPath
    this.viteDevServerUrl = viteDevServerUrl
  }

  /**
   * 创建主窗口
   */
  async createMainWindow(): Promise<BrowserWindow | null> {
    try {
      // 1. 获取屏幕尺寸，根据屏幕大小调整窗口尺寸
      const primaryDisplay = screen.getPrimaryDisplay()
      const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize
      
      // 智能计算窗口大小，根据屏幕尺寸自动调整比例
      let widthRatio = 0.79 // 默认宽度比例
      let heightRatio = 0.99 // 默认高度比例
      
      // 屏幕尺寸判断
      const isSmallScreen = screenHeight < 900 || screenWidth < 1400
      const isLargeScreen = screenHeight > 1080 && screenWidth > 1920
      
      // 根据屏幕尺寸调整比例
      if (isSmallScreen) {
        // 小屏幕使用更大的比例
        widthRatio = 0.79
        heightRatio = 0.99
      } else if (isLargeScreen) {
        // 大屏幕使用更小的比例
        widthRatio = 0.8
        heightRatio = 0.9
      }
      
      // 获取配置的默认窗口大小
      const defaultSize = configManager.window.getDefaultSize()
      
      // 计算最终窗口大小
      const windowWidth = Math.min(1400, Math.floor(screenWidth * widthRatio))
      const windowHeight = Math.min(900, Math.floor(screenHeight * heightRatio))
      
      // 记录窗口大小配置
      log.info('Window size configured:', {
        calculated: { width: windowWidth, height: windowHeight },
        default: defaultSize,
        screen: { width: screenWidth, height: screenHeight }
      })
      
      // 确保窗口尺寸不小于最小要求
      const minWindowWidth = Math.min(1024, Math.floor(screenWidth * 0.75))
      const minWindowHeight = Math.min(768, Math.floor(screenHeight * 0.8))

      // 2. 创建窗口（隐藏状态）
      this.mainWindow = new BrowserWindow({
        title: 'Main window',
        icon: path.join(process.env.VITE_PUBLIC!, 'logo.svg'),
        width: windowWidth,
        height: windowHeight,
        minWidth: minWindowWidth, // 最小宽度，根据屏幕大小调整
        minHeight: minWindowHeight, // 最小高度，根据屏幕大小调整
        show: false, // 先隐藏，等加载完成后再显示
        backgroundColor: '#ffffff', // 背景色
        frame: false, // 完全隐藏默认标题栏和窗口控制按钮
        titleBarStyle: undefined,
        webPreferences: {
          preload: this.preload,
        },
      })

      // 3. 设置窗口位置到屏幕中央
      this.mainWindow.setPosition(Math.floor((screenWidth - windowWidth) / 2), Math.floor((screenHeight - windowHeight) / 2))

      // 4. 注册 ready-to-show 事件监听器（优先使用事件）
      let windowShown = false
      this.mainWindow.on('ready-to-show', () => {
        if (!windowShown) {
          windowShown = true
          this.mainWindow?.show()
          log.info('Main window shown via ready-to-show event')
        }
      })

      // 4. 添加超时机制（作为备份，确保窗口一定显示）
      const showTimeout = setTimeout(() => {
        if (!windowShown) {
          windowShown = true
          this.mainWindow?.show()
          log.info('Main window shown via timeout fallback')
        }
      }, 5000) // 5秒超时

      // 5. 监听窗口状态变化，保存到配置
      this.mainWindow.on('maximize', () => {
        configManager.window.setIsMaximized(true)
        log.info('Window maximized state saved')
      })

      this.mainWindow.on('unmaximize', () => {
        configManager.window.setIsMaximized(false)
        log.info('Window unmaximized state saved')
      })

      // 6. 加载内容
      if (this.viteDevServerUrl) {
        await this.mainWindow.loadURL(this.viteDevServerUrl)
        // 开发环境打开开发者工具
        this.mainWindow.webContents.openDevTools()
        log.info('Main window loaded from dev server')
      } else {
        await this.mainWindow.loadFile(this.indexHtml)
        log.info('Main window loaded from local file')
      }

      // 6. 清理超时计时器
      this.mainWindow.on('closed', () => {
        clearTimeout(showTimeout)
        this.mainWindow = null
        log.info('Main window closed and cleaned up')
      })

      // 7. Make all links open with the browser, not with the application
      this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('https:')) {
          shell.openExternal(url)
          log.info('External URL opened:', url)
        }
        return { action: 'deny' }
      })

      // 8. 监听窗口大小变化，保存到配置
      this.mainWindow.on('resize', () => {
        if (this.mainWindow && !this.mainWindow.isMaximized()) {
          const [width, height] = this.mainWindow.getSize()
          configManager.window.setSize({ width, height })
        }
      })

      // 为窗口添加上下文菜单
      this.setupContextMenu(this.mainWindow!)
      
      log.info('Main window created successfully')
      return this.mainWindow
    } catch (error) {
      log.error('Failed to create main window:', error)
      return null
    }
  }

  /**
   * 创建次级窗口
   */
  createSecondaryWindow(windowId: string, options: SecondaryWindowOptions): BrowserWindow | null {
    try {
      const win = new BrowserWindow({
        title: options.title || 'Secondary Window',
        icon: path.join(process.env.VITE_PUBLIC!, 'logo.svg'),
        width: options.width || 800,
        height: options.height || 600,
        minWidth: options.minWidth || 400,
        minHeight: options.minHeight || 300,
        show: false,
        backgroundColor: '#ffffff',
        frame: false,
        titleBarStyle: undefined,
        webPreferences: {
          preload: this.preload,
        },
      })

      // 加载URL
      const url = this.viteDevServerUrl 
        ? `${this.viteDevServerUrl}#${options.route}` 
        : `${this.indexHtml}#${options.route}`
      win.loadURL(url)

      // 窗口加载完成后显示
      win.on('ready-to-show', () => {
        win.show()
        log.info(`Secondary window ${windowId} shown`)
      })

      // 窗口关闭时清理
      win.on('closed', () => {
        this.secondaryWindows.delete(windowId)
        log.info(`Secondary window ${windowId} closed and cleaned up`)
      })

      // 为窗口添加上下文菜单
      this.setupContextMenu(win)
      
      // 保存窗口引用
      this.secondaryWindows.set(windowId, win)
      log.info(`Secondary window ${windowId} created successfully`)

      return win
    } catch (error) {
      log.error(`Failed to create secondary window ${windowId}:`, error)
      return null
    }
  }

  /**
   * 关闭次级窗口
   */
  closeSecondaryWindow(windowId: string): boolean {
    try {
      const win = this.secondaryWindows.get(windowId)
      if (win) {
        win.close()
        this.secondaryWindows.delete(windowId)
        log.info(`Secondary window ${windowId} closed successfully`)
        return true
      }
      log.warn(`Secondary window ${windowId} not found`)
      return false
    } catch (error) {
      log.error(`Failed to close secondary window ${windowId}:`, error)
      return false
    }
  }

  /**
   * 关闭所有次级窗口
   */
  closeAllSecondaryWindows(): void {
    try {
      this.secondaryWindows.forEach((win, windowId) => {
        win.close()
        log.info(`Secondary window ${windowId} closed`)
      })
      this.secondaryWindows.clear()
      log.info('All secondary windows closed and cleaned up')
    } catch (error) {
      log.error('Failed to close all secondary windows:', error)
    }
  }

  /**
   * 获取主窗口
   */
  getMainWindow(): BrowserWindow | null {
    return this.mainWindow
  }

  /**
   * 获取次级窗口
   */
  getSecondaryWindow(windowId: string): BrowserWindow | undefined {
    return this.secondaryWindows.get(windowId)
  }

  /**
   * 获取所有次级窗口的ID
   */
  getAllSecondaryWindowIds(): string[] {
    return Array.from(this.secondaryWindows.keys())
  }

  /**
   * 最小化主窗口
   */
  minimizeMainWindow(): void {
    try {
      this.mainWindow?.minimize()
      log.info('Main window minimized')
    } catch (error) {
      log.error('Failed to minimize main window:', error)
    }
  }

  /**
   * 最大化/还原主窗口
   */
  toggleMaximizeMainWindow(): void {
    try {
      if (this.mainWindow?.isMaximized()) {
        this.mainWindow.restore()
        log.info('Main window restored')
      } else {
        this.mainWindow?.maximize()
        log.info('Main window maximized')
      }
    } catch (error) {
      log.error('Failed to toggle maximize state:', error)
    }
  }

  /**
   * 切换主窗口置顶状态
   */
  toggleAlwaysOnTop(): void {
    try {
      if (this.mainWindow) {
        const isAlwaysOnTop = this.mainWindow.isAlwaysOnTop()
        this.mainWindow.setAlwaysOnTop(!isAlwaysOnTop)
        log.info(`Main window always-on-top set to: ${!isAlwaysOnTop}`)
      }
    } catch (error) {
      log.error('Failed to toggle always-on-top:', error)
    }
  }

  /**
   * 关闭主窗口
   */
  closeMainWindow(): void {
    try {
      this.mainWindow?.close()
      log.info('Main window close requested')
    } catch (error) {
      log.error('Failed to close main window:', error)
    }
  }

  /**
   * 清理所有窗口引用
   */
  cleanup(): void {
    this.mainWindow = null
    this.closeAllSecondaryWindows()
    log.info('Window manager cleaned up')
  }
  
  /**
   * 为窗口添加上下文菜单
   */
  setupContextMenu(window: BrowserWindow) {
    // 获取窗口的 webContents
    const webContents = window.webContents
    
    // 添加 context-menu 事件监听器 - 现在只用于非卡片区域
    webContents.on('context-menu', (event, params) => {
      // 阻止默认的上下文菜单
      event.preventDefault()
      
      // 非卡片区域不显示任何菜单
    })
  }
  
  /**
   * 显示卡片右键菜单
   */
  showCardContextMenu(window: BrowserWindow) {
    // 获取窗口的 webContents
    const webContents = window.webContents
    
    // 创建卡片菜单模板
    const menuTemplate: Electron.MenuItemConstructorOptions[] = [
      {
        label: '编辑卡片',
        click: () => {
          // 通过IPC通知渲染进程打开编辑卡片对话框
          webContents.send('context-menu:edit-card')
        }
      },
      {
        label: '删除卡片',
        click: () => {
          // 通过IPC通知渲染进程删除卡片
          webContents.send('context-menu:delete-card')
        }
      }
    ]
    
    // 创建并显示菜单
    const menu = Menu.buildFromTemplate(menuTemplate)
    menu.popup({
      window: window
    })
  }
}

// 默认导出
export default WindowManager
