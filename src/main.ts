import { createApp } from 'vue'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import router from './router'
import 'uno.css'

import './style.css'
import './styles/icon-grid.css'

// 图标预加载已通过 unocss.config.ts 自动处理，从 src/config/icons.ts 加载

const app = createApp(App)

// 定义electronAPI的类型
interface ElectronAPI {
  windowMinimize: () => void
  windowMaximize: () => void
  windowTogglePin: () => void
  windowClose: () => void
  invoke: <T = any>(channel: string, ...args: any[]) => Promise<T>
  send: (channel: string, ...args: any[]) => void
  on: (channel: string, listener: (event: any, ...args: any[]) => void) => void
  off: (channel: string, listener: (event: any, ...args: any[]) => void) => void
}

// 监听快捷键事件
const electronAPI = window.electronAPI as ElectronAPI | undefined
if (electronAPI) {
  // 保存
  electronAPI.on('shortcut:save', () => {
    console.log('Save shortcut received')
    // 触发全局保存事件
    app.config.globalProperties.$emit?.('shortcut:save')
  })
  
  // 复制
  electronAPI.on('shortcut:copy', () => {
    console.log('Copy shortcut received')
  })
  
  // 粘贴
  electronAPI.on('shortcut:paste', () => {
    console.log('Paste shortcut received')
  })
  
  // 剪切
  electronAPI.on('shortcut:cut', () => {
    console.log('Cut shortcut received')
  })
  
  // 全选
  electronAPI.on('shortcut:select-all', () => {
    console.log('Select all shortcut received')
  })
  
  // 撤销
  electronAPI.on('shortcut:undo', () => {
    console.log('Undo shortcut received')
  })
  
  // 重做
  electronAPI.on('shortcut:redo', () => {
    console.log('Redo shortcut received')
  })
}

app
  .use(ElementPlus)
  .use(router)
  .mount('#app')
  .$nextTick(() => {
    postMessage({ payload: 'removeLoading' }, '*')
  })
