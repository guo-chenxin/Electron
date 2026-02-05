import { createApp } from 'vue'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import router from './router'
import 'uno.css'

import './style.css'
import './styles/icon-grid.css'

// 图标预加载已通过 unocss.config.ts 自动处理，从 src/config/icons.ts 加载

createApp(App)
  .use(ElementPlus)
  .use(router)
  .mount('#app')
  .$nextTick(() => {
    postMessage({ payload: 'removeLoading' }, '*')
  })
