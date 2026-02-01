## electron-vite-vue
🥳 一个非常简洁的 Electron + Vue + Vite 脚手架模板。

## 特性
📦 开箱即用
🎯 基于官方 template-vue-ts，侵入性极小
🌱 可扩展性强，目录结构极其简洁
💪 支持在 Electron 渲染进程（Renderer）中使用 Node.js API
🔩 支持 C/C++ 原生插件（Native Addons）
🖥 轻松实现多窗口应用

## 快速开始

```sh
# 克隆项目
git clone https://github.com/guo-chenxin/Electron.git

# 进入项目目录
cd electron-vite-vue

# 安装依赖
npm install

# 启动开发模式
npm run dev
```

## 调试演示

![electron-vite-react-debug.gif](https://github.com/electron-vite/electron-vite-react/blob/main/electron-vite-react-debug.gif?raw=true)

## 目录结构

```diff
+ ├─┬ electron
+ │ ├─┬ main
+ │ │ └── index.ts    entry of Electron-Main
+ │ └─┬ preload
+ │   └── index.ts    entry of Preload-Scripts
  ├─┬ src
  │ └── main.ts       entry of Electron-Renderer
  ├── index.html
  ├── package.json
  └── vite.config.ts
```