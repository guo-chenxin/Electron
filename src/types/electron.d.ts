// 扩展Window接口，添加electronAPI
declare interface Window {
  electronAPI: {
    windowMinimize: () => void
    windowMaximize: () => void
    windowClose: () => void
    invoke: (channel: string, ...args: any[]) => Promise<any>
    send: (channel: string, ...args: any[]) => void
    on: (channel: string, listener: (event: any, ...args: any[]) => void) => void
    off: (channel: string, listener: (event: any, ...args: any[]) => void) => void
  }
}