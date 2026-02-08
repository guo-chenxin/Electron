// 扩展Window接口，添加electronAPI和electron属性
declare interface Window {
  electronAPI: {
    windowMinimize: () => void
    windowMaximize: () => void
    windowTogglePin: () => void
    windowClose: () => void
    invoke: <T = any>(channel: string, ...args: any[]) => Promise<T>
    send: (channel: string, ...args: any[]) => void
    on: (channel: string, listener: (event: any, ...args: any[]) => void) => void
    off: (channel: string, listener: (event: any, ...args: any[]) => void) => void
  }
  electron?: {
    ipcRenderer?: {
      send: (channel: string, ...args: any[]) => void
      on: (channel: string, listener: (event: any, ...args: any[]) => void) => void
    }
  }
}

// 添加electron-ipc-proxy的类型声明
declare module 'electron-ipc-proxy/renderer' {
  export function useProxy<T extends object>(channel: string): T
}

declare module 'electron-ipc-proxy/main' {
  export function expose<T extends object>(channel: string, api: T): void
}