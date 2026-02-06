// 扩展Window接口，添加electronAPI
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
}