// electron-localshortcut 类型声明
declare module 'electron-localshortcut' {
  import { BrowserWindow } from 'electron'

  export function register(window: BrowserWindow, accelerator: string, callback: () => void): void
  export function unregister(window: BrowserWindow, accelerator: string): void
  export function unregisterAll(window?: BrowserWindow): void
  export function isRegistered(window: BrowserWindow, accelerator: string): boolean
}

// electron-ipc-proxy 类型声明
declare module 'electron-ipc-proxy/main' {
  export function expose<T extends object>(channel: string, api: T): void
}

// electron-window-state 类型声明
declare module 'electron-window-state' {
  import { BrowserWindow } from 'electron'

  interface WindowStateOptions {
    defaultWidth?: number
    defaultHeight?: number
    path?: string
  }

  interface WindowState {
    x: number
    y: number
    width: number
    height: number
    isMaximized: boolean
    isFullScreen: boolean
    manage: (window: BrowserWindow) => void
  }

  function windowStateKeeper(options?: WindowStateOptions): WindowState

  export default windowStateKeeper
}
