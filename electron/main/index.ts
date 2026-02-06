import { app, BrowserWindow, shell, ipcMain, screen } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import os from 'node:os'

// 导入后端模块
import { db } from './backend/db/database'
import { apiManager } from './backend/api/apiManager'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.mjs   > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
process.env.APP_ROOT = path.join(__dirname, '../..')

export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST

// Disable GPU Acceleration for Windows 7
if (os.release().startsWith('6.1')) app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

// 使用自定义标题栏，不需要设置应用菜单
// Menu.setApplicationMenu(null)

// 窗口管理
let mainWindow: BrowserWindow | null = null
const secondaryWindows: Map<string, BrowserWindow> = new Map()

// 预加载脚本路径，在开发模式和生产模式下都能正确找到
const preload = path.join(process.env.APP_ROOT, 'dist-electron/preload/index.mjs')
const indexHtml = path.join(RENDERER_DIST, 'index.html')

// 创建主窗口
async function createMainWindow() {
  // 1. 创建窗口（隐藏状态）
  mainWindow = new BrowserWindow({
    title: 'Main window',
    icon: path.join(process.env.VITE_PUBLIC, 'logo.svg'),
    width: 1400, // 初始宽度，参考Apifox
    height: 900, // 初始高度，参考Apifox
    minWidth: 1024, // 最小宽度
    minHeight: 768, // 最小高度
    show: false, // 先隐藏，等加载完成后再显示
    backgroundColor: '#ffffff', // 背景色
    frame: false, // 完全隐藏默认标题栏和窗口控制按钮
    titleBarStyle: undefined,
    webPreferences: {
      preload,
      // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
      // nodeIntegration: true,

      // Consider using contextBridge.exposeInMainWorld
      // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
      // contextIsolation: false,
    },
  })

  // 2. 设置窗口位置到屏幕中央
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width, height } = primaryDisplay.workAreaSize
  mainWindow.setPosition(Math.floor((width - 1400) / 2), Math.floor((height - 900) / 2))

  // 3. 注册 ready-to-show 事件监听器（优先使用事件）
  let windowShown = false
  mainWindow.on('ready-to-show', () => {
    if (!windowShown) {
      windowShown = true
      mainWindow?.show()
    }
  })

  // 4. 添加超时机制（作为备份，确保窗口一定显示）
  const showTimeout = setTimeout(() => {
    if (!windowShown) {
      windowShown = true
      mainWindow?.show()
    }
  }, 5000) // 5秒超时

  // 5. 加载内容
  if (VITE_DEV_SERVER_URL) { // #298
    await mainWindow.loadURL(VITE_DEV_SERVER_URL)
    // 开发环境打开开发者工具
    mainWindow.webContents.openDevTools()
  } else {
    await mainWindow.loadFile(indexHtml)
  }

  // 6. 清理超时计时器
  mainWindow.on('closed', () => {
    clearTimeout(showTimeout)
    mainWindow = null
  })

  // 7. Make all links open with the browser, not with the application
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })

  return mainWindow
}

// 创建次级窗口
function createSecondaryWindow(windowId: string, options: any) {
  const win = new BrowserWindow({
    title: options.title || 'Secondary Window',
    icon: path.join(process.env.VITE_PUBLIC, 'logo.svg'),
    width: options.width || 800,
    height: options.height || 600,
    minWidth: options.minWidth || 400,
    minHeight: options.minHeight || 300,
    show: false,
    backgroundColor: '#ffffff',
    frame: false,
    titleBarStyle: undefined,
    webPreferences: {
      preload,
    },
  })

  // 加载URL
  const url = VITE_DEV_SERVER_URL 
    ? `${VITE_DEV_SERVER_URL}#${options.route}` 
    : `${indexHtml}#${options.route}`
  win.loadURL(url)

  // 窗口加载完成后显示
  win.on('ready-to-show', () => {
    win.show()
  })

  // 窗口关闭时清理
  win.on('closed', () => {
    secondaryWindows.delete(windowId)
  })

  // 保存窗口引用
  secondaryWindows.set(windowId, win)

  return win
}

// 关闭次级窗口
function closeSecondaryWindow(windowId: string) {
  const win = secondaryWindows.get(windowId)
  if (win) {
    win.close()
    secondaryWindows.delete(windowId)
  }
}

// 关闭所有次级窗口
function closeAllSecondaryWindows() {
  secondaryWindows.forEach((win) => {
    win.close()
  })
  secondaryWindows.clear()
}

// Handle window control events from renderer
ipcMain.on('window-minimize', () => {
  mainWindow?.minimize()
})

ipcMain.on('window-maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.restore()
  } else {
    mainWindow?.maximize()
  }
})

ipcMain.on('window-toggle-pin', () => {
  if (mainWindow) {
    const isAlwaysOnTop = mainWindow.isAlwaysOnTop()
    mainWindow.setAlwaysOnTop(!isAlwaysOnTop)
  }
})

ipcMain.on('window-close', () => {
  mainWindow?.close()
})

// 多窗口相关IPC事件
ipcMain.handle('window:create-secondary', (_, windowId: string, options: any) => {
  try {
    createSecondaryWindow(windowId, options)
    return { success: true }
  } catch (error: any) {
    console.error('Failed to create secondary window:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('window:close-secondary', (_, windowId: string) => {
  try {
    closeSecondaryWindow(windowId)
    return { success: true }
  } catch (error: any) {
    console.error('Failed to close secondary window:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('window:close-all-secondary', () => {
  try {
    closeAllSecondaryWindows()
    return { success: true }
  } catch (error: any) {
    console.error('Failed to close all secondary windows:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('window:get-all-secondary', () => {
  return Array.from(secondaryWindows.keys())
})

// 应用启动时初始化后端
app.whenReady().then(async () => {
  try {
    console.log('Starting backend initialization...')
    
    // 初始化数据库
    await db.connect()
    await db.initialize()
    
    console.log('Database initialization completed successfully')
    
    // 初始化API路由
    apiManager.initialize()
    console.log('API routes initialization completed successfully')
    
    // 初始化预定义路由
    const { seedInitialRoutes } = await import('./backend/db/seedRoutes')
    await seedInitialRoutes()
    console.log('Initial routes seeded successfully')
    
    // 创建主窗口
    await createMainWindow()
  } catch (error) {
    console.error('Backend initialization failed:', error)
  }
})

app.on('window-all-closed', () => {
  mainWindow = null
  closeAllSecondaryWindows()
  if (process.platform !== 'darwin') app.quit()
})

app.on('second-instance', () => {
  if (mainWindow) {
    // Focus on the main window if the user tried to open another
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  }
})

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length) {
    allWindows[0].focus()
  } else {
    createMainWindow()
  }
})

// 应用退出时关闭数据库连接
app.on('before-quit', async () => {
  try {
    await db.close()
    console.log('Database connection closed on app exit')
  } catch (error) {
    console.error('Failed to close database connection on app exit:', error)
  }
})
