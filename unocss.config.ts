import { defineConfig } from 'unocss'
import { presetIcons } from 'unocss'
import { iconList } from './src/config/icons'

// 从图标列表中提取所有图标类名
const iconClasses = iconList.map(icon => icon.value)

// 生成预加载的图标列表
const preloadIcons = iconClasses.join(' ')

// 打印预加载的图标列表，方便调试
console.log('Preloading icons:', preloadIcons)

export default defineConfig({
  presets: [
    presetIcons({
      prefix: 'i-',
      extraProperties: {
        display: 'inline-block',
        'vertical-align': 'middle'
      },
      // 配置图标源，使用iconify的Carbon图标
      provider: 'iconify',
      // 确保所有Carbon图标都能被正确解析
      collections: {
        carbon: {
          package: '@iconify-json/carbon'
        }
      }
    })
  ],
  // 配置要扫描的文件，确保UnoCSS能识别所有使用的图标
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  // 直接在safelist中包含所有图标类名，确保它们能被UnoCSS识别
  safelist: iconClasses
})

// 确保在模块加载时就注册所有图标
console.log('All icons registered:', iconClasses.length, 'icons')