import { app } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import os from 'node:os'

// 导入核心插件
import log from 'electron-log'
import isDev from 'electron-is-dev'
import unhandled from 'electron-unhandled'

// 导入后端模块
import { db } from './backend/db/database'
import { apiManager } from './backend/api/apiManager'

// 导入管理模块
import { WindowManager } from './backend/utils/windowManager'
import { IpcManager } from './backend/utils/ipcManager'
import { ShortcutManager } from './backend/utils/shortcutManager'
import { LifecycleManager } from './backend/utils/lifecycleManager'

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

// 配置electron-log
log.transports.file.level = 'info'
log.transports.file.maxSize = 10 * 1024 * 1024 // 10MB
log.transports.file.resolvePathFn = () => path.join(app.getPath('userData'), 'logs', 'app.log')

// 配置electron-unhandled
unhandled({
  logger: (error) => {
    log.error('Unhandled error:', error)
  },
  showDialog: true,
  reportButton: (error) => {
    log.error('Error reported:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      appVersion: app.getVersion(),
      electronVersion: process.versions.electron,
      nodeVersion: process.versions.node
    })
  }
})

// 开发环境热重载
if (isDev) {
  try {
    // 使用正确的方式导入和使用 electron-reloader
    import('electron-reloader').then(() => {
      // electron-reloader 会自动处理热重载
      log.info('Electron reloader initialized')
    })
  } catch (e) {
    log.error('Electron reloader error:', e)
  }
}

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

// 预加载脚本路径，在开发模式和生产模式下都能正确找到
const preload = path.join(process.env.APP_ROOT, 'dist-electron/preload/index.mjs')
const indexHtml = path.join(RENDERER_DIST, 'index.html')

// 初始化管理模块
const windowManager = new WindowManager(preload, indexHtml, VITE_DEV_SERVER_URL)
const shortcutManager = new ShortcutManager()
const ipcManager = new IpcManager(windowManager)
const lifecycleManager = new LifecycleManager(windowManager, shortcutManager)

// 设置数据库和API管理器
lifecycleManager.setDatabase(db)
lifecycleManager.setApiManager(apiManager)

// 初始化应用
function initializeApp(): void {
  try {
    // 初始化IPC事件
    ipcManager.initialize()
    
    // 初始化生命周期事件
    lifecycleManager.initialize()
    
    log.info('Application initialization started')
  } catch (error) {
    log.error('Failed to initialize application:', error)
  }
}



// 启动应用
initializeApp()
