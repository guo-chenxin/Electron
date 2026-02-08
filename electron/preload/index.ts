import { ipcRenderer, contextBridge, IpcRendererEvent } from 'electron'

// 定义electronAPI接口类型
interface ElectronAPI {
  // 窗口控制API
  windowMinimize: () => void
  windowMaximize: () => void
  windowTogglePin: () => void
  windowClose: () => void
  
  // IPC通信API
  on: (channel: string, listener: (event: IpcRendererEvent, ...args: any[]) => void) => () => void
  off: (channel: string, listener: (event: IpcRendererEvent, ...args: any[]) => void) => void
  send: (channel: string, ...args: any[]) => void
  invoke: <T = any>(channel: string, ...args: any[]) => Promise<T>
}

// 安全的IPC通道列表
const ALLOWED_CHANNELS = [
  // 窗口控制通道
  'window-minimize',
  'window-maximize',
  'window-toggle-pin',
  'window-close',
  
  // 多窗口管理通道
  'window:create-secondary',
  'window:close-secondary',
  'window:close-all-secondary',
  'window:get-all-secondary',
  
  // 上下文菜单通道
  'context-menu:show-card-menu',
  
  // 认证相关通道
  'api:auth:sendVerificationCode',
  'api:auth:loginWithCode',
  'api:auth:loginWithPassword',
  'api:auth:getCurrentUser',
  'api:auth:refreshToken',
  'api:auth:logout',
  
  // 卡片相关通道
  'api:cards:getAll',
  'api:cards:getById',
  'api:cards:create',
  'api:cards:update',
  'api:cards:delete',
  
  // 路由相关通道
  'api:routes:getAllNested',
  'api:routes:getAll',
  'api:routes:getById',
  'api:routes:create',
  'api:routes:update',
  'api:routes:delete',
  'api:routes:createProjectRoutes',
  
  // 用户相关通道
  'api:users:getAll',
  'api:users:getById',
  'api:users:getByUsername',
  'api:users:create',
  'api:users:update',
  'api:users:delete',
  
  // 文章相关通道
  'api:articles:getAll',
  'api:articles:getById',
  'api:articles:getByAuthorId',
  'api:articles:getByCategoryId',
  'api:articles:getByStatus',
  'api:articles:create',
  'api:articles:update',
  'api:articles:delete',
  'api:articles:incrementViewCount',
  
  // 分类相关通道
  'api:categories:getAll',
  'api:categories:getById',
  'api:categories:create',
  'api:categories:update',
  'api:categories:delete',
  'api:categories:getStatistics',
  
  // 快捷键通道
  'shortcut:save',
  'shortcut:copy',
  'shortcut:paste',
  'shortcut:cut',
  'shortcut:select-all',
  'shortcut:undo',
  'shortcut:redo',
  
  // 右键菜单通道
  'context-menu:edit-card',
  'context-menu:delete-card'
]

// 验证通道是否安全
const isValidChannel = (channel: string): boolean => {
  return ALLOWED_CHANNELS.includes(channel)
}

// --------- Expose some API to the Renderer process ---------
try {
  contextBridge.exposeInMainWorld('electronAPI', {
    // 窗口控制API
    windowMinimize: () => {
      if (isValidChannel('window-minimize')) {
        ipcRenderer.send('window-minimize')
      }
    },
    windowMaximize: () => {
      if (isValidChannel('window-maximize')) {
        ipcRenderer.send('window-maximize')
      }
    },
    windowTogglePin: () => {
      if (isValidChannel('window-toggle-pin')) {
        ipcRenderer.send('window-toggle-pin')
      }
    },
    windowClose: () => {
      if (isValidChannel('window-close')) {
        ipcRenderer.send('window-close')
      }
    },
    
    // IPC通信API
    on: (channel: string, listener: (event: IpcRendererEvent, ...args: any[]) => void) => {
      if (isValidChannel(channel)) {
        ipcRenderer.on(channel, listener)
        return () => ipcRenderer.off(channel, listener)
      }
      return () => {}
    },
    off: (channel: string, listener: (event: IpcRendererEvent, ...args: any[]) => void) => {
      if (isValidChannel(channel)) {
        ipcRenderer.off(channel, listener)
      }
    },
    send: (channel: string, ...args: any[]) => {
      if (isValidChannel(channel)) {
        ipcRenderer.send(channel, ...args)
      }
    },
    invoke: async <T = any>(channel: string, ...args: any[]): Promise<T> => {
      if (isValidChannel(channel)) {
        return ipcRenderer.invoke(channel, ...args)
      }
      throw new Error(`Invalid channel: ${channel}`)
    },
  } as ElectronAPI)
} catch (error) {
  console.error('Failed to expose electronAPI:', error)
}

// --------- Preload scripts loading ---------
function domReady(condition: DocumentReadyState[] = ['complete', 'interactive']): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      if (condition.includes(document.readyState)) {
        resolve(true)
      } else {
        const handleReadyStateChange = () => {
          if (condition.includes(document.readyState)) {
            document.removeEventListener('readystatechange', handleReadyStateChange)
            resolve(true)
          }
        }
        document.addEventListener('readystatechange', handleReadyStateChange)
      }
    } catch (error) {
      console.error('Error in domReady:', error)
      resolve(false)
    }
  })
}

const safeDOM = {
  append(parent: HTMLElement, child: HTMLElement): HTMLElement | null {
    try {
      if (!parent || !child) return null
      if (!Array.from(parent.children).find(e => e === child)) {
        return parent.appendChild(child)
      }
      return null
    } catch (error) {
      console.error('Error appending element:', error)
      return null
    }
  },
  remove(parent: HTMLElement, child: HTMLElement): HTMLElement | null {
    try {
      if (!parent || !child) return null
      if (Array.from(parent.children).find(e => e === child)) {
        return parent.removeChild(child)
      }
      return null
    } catch (error) {
      console.error('Error removing element:', error)
      return null
    }
  },
}

/**
 * https://tobiasahlin.com/spinkit
 * https://connoratherton.com/loaders
 * https://projects.lukehaas.me/css-loaders
 * https://matejkustec.github.io/SpinThatShit
 */
function useLoading() {
  const className = `loaders-css__square-spin`
  const styleContent = `
@keyframes square-spin {
  25% { transform: perspective(100px) rotateX(180deg) rotateY(0); }
  50% { transform: perspective(100px) rotateX(180deg) rotateY(180deg); }
  75% { transform: perspective(100px) rotateX(0) rotateY(180deg); }
  100% { transform: perspective(100px) rotateX(0) rotateY(0); }
}
.${className} > div {
  animation-fill-mode: both;
  width: 50px;
  height: 50px;
  background: #fff;
  animation: square-spin 3s 0s cubic-bezier(0.09, 0.57, 0.49, 0.9) infinite;
}
.app-loading-wrap {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #282c34;
  z-index: 9999;
}
    `
  
  let oStyle: HTMLStyleElement | null = null
  let oDiv: HTMLDivElement | null = null

  const createElements = () => {
    try {
      oStyle = document.createElement('style')
      oDiv = document.createElement('div')

      oStyle.id = 'app-loading-style'
      oStyle.innerHTML = styleContent
      oDiv.className = 'app-loading-wrap'
      oDiv.innerHTML = `<div class="${className}"><div></div></div>`
    } catch (error) {
      console.error('Error creating loading elements:', error)
    }
  }

  createElements()

  return {
    appendLoading(): void {
      try {
        if (oStyle && oDiv) {
          safeDOM.append(document.head, oStyle)
          safeDOM.append(document.body, oDiv)
        }
      } catch (error) {
        console.error('Error appending loading:', error)
      }
    },
    removeLoading(): void {
      try {
        if (oStyle && oDiv) {
          safeDOM.remove(document.head, oStyle)
          safeDOM.remove(document.body, oDiv)
        }
      } catch (error) {
        console.error('Error removing loading:', error)
      }
    },
  }
}

// ----------------------------------------------------------------------

const { appendLoading, removeLoading } = useLoading()
domReady().then((success) => {
  if (success) {
    appendLoading()
  }
})

// 处理来自渲染进程的消息
window.onmessage = (ev: MessageEvent) => {
  try {
    if (ev.data && ev.data.payload === 'removeLoading') {
      removeLoading()
    }
  } catch (error) {
    console.error('Error handling message:', error)
  }
}

// 安全的超时处理，防止加载动画无限显示
const loadingTimeout = setTimeout(() => {
  try {
    removeLoading()
  } catch (error) {
    console.error('Error in loading timeout:', error)
  }
}, 4999)

// 清理函数
window.addEventListener('unload', () => {
  clearTimeout(loadingTimeout)
})
