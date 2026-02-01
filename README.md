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
