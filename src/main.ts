import { createApp } from 'vue'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import router from './router'
import 'uno.css'

import './style.css'
import './styles/icon-grid.css'

// 静态引入常用图标，确保UnoCSS能预加载它们
// @unocss-include i-carbon-home i-carbon-grid i-carbon-star i-carbon-time i-carbon-edit i-carbon-folder i-carbon-tag i-carbon-settings i-carbon-launch i-carbon-play

createApp(App)
  .use(ElementPlus)
  .use(router)
  .mount('#app')
  .$nextTick(() => {
    postMessage({ payload: 'removeLoading' }, '*')
  })
