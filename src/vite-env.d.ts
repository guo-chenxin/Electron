/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// 声明虚拟路由模块，解决TypeScript错误
declare module 'virtual:generated-routes' {
  import type { RouteRecordRaw } from 'vue-router'
  const routes: RouteRecordRaw[]
  export { routes }
}

interface Window {
  // expose in the `electron/preload/index.ts`
  electronAPI: {
    invoke: <T = any>(channel: string, ...args: any[]) => Promise<T>
  }
}
