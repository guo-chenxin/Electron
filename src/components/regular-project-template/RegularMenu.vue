<template>
  <div class="regular-menu">
    <el-menu
      class="el-menu-vertical-demo"
      :default-active="activeMenu"
      @select="handleMenuSelect"
      unique-opened
    >
      <!-- 直接渲染所有菜单项，包括子菜单 -->
      <el-menu-item 
        v-for="menu in flattenedMenuItems" 
        :key="menu.path" 
        :index="menu.path" 
        @click="handleMenuItemClick(menu.path)"
      >
        <!-- 直接使用menu.icon作为完整的图标类名，不添加额外的类 -->
        <i :class="menu.icon"></i>
        <span>{{ menu.title }}</span>
      </el-menu-item>
    </el-menu>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// 添加electron和unocss的类型声明
declare global {
  interface Window {
    electronAPI: {
      invoke: <T = any>(channel: string, ...args: any[]) => Promise<T>
    }
    __unocss?: {
      apply: () => void
    }
  }
}

// 定义菜单数据类型
interface MenuItem {
  path: string
  title: string
  icon: string
  children?: MenuItem[]
}

// 全局活动菜单状态，存储每个标签页的活动菜单项（移到模块顶层，确保不被重置）
let globalActiveMenus: Record<string, string> = {}

const route = useRoute()
const router = useRouter()
const menuItems = ref<MenuItem[]>([])

// 从全局状态获取当前标签页的活动菜单项
const getActiveMenu = () => {
  // 提取标签页路径（第一级路径）
  const pathParts = route.path.split('/').filter(Boolean)
  const tabPath = pathParts.length > 0 ? `/${pathParts[0]}` : '/'
  return globalActiveMenus[tabPath] || ''
}

// 保存活动菜单项到全局状态
const saveActiveMenu = (menuPath: string) => {
  // 提取标签页路径（第一级路径）
  const pathParts = route.path.split('/').filter(Boolean)
  const tabPath = pathParts.length > 0 ? `/${pathParts[0]}` : '/'
  globalActiveMenus[tabPath] = menuPath
  console.log('Saved active menu:', tabPath, '->', menuPath)
  console.log('Global active menus:', globalActiveMenus)
}

// 初始化activeMenu
const activeMenu = ref('')

// 从路由中获取当前激活标签页对应的菜单
const currentMenuItems = computed(() => {
  // 检查当前路由路径，确定显示哪个标签页的菜单
  console.log('Current route path:', route.path)
  console.log('All menu items:', menuItems.value)
  
  // 根据当前路由路径选择对应的菜单
  let menuPath = '/'
  
  // 提取路由路径的第一部分，如 /abc/home -> /abc
  const pathParts = route.path.split('/').filter(Boolean)
  if (pathParts.length > 0) {
    menuPath = `/${pathParts[0]}`
  }
  
  console.log('Determined menu path:', menuPath)
  
  // 查找对应的菜单
  const currentMenu = menuItems.value.find(item => item.path === menuPath)
  console.log('Current menu found:', currentMenu)
  const result = currentMenu?.children || []
  console.log('Menu children to display:', result)
  return result
})

// 将菜单扁平化为一级菜单，直接显示所有菜单项
const flattenedMenuItems = computed(() => {
  const result: MenuItem[] = []
  
  // 递归扁平化菜单
  const flatten = (items: MenuItem[]) => {
    for (const item of items) {
      // 添加当前菜单项到结果中
      result.push(item)
      
      // 如果有子菜单，递归处理子菜单
      if (item.children && item.children.length > 0) {
        flatten(item.children)
      }
    }
  }
  
  // 对当前菜单进行扁平化处理
  flatten(currentMenuItems.value)
  return result
})

// 处理菜单选择
const handleMenuSelect = (index: string) => {
  activeMenu.value = index
  // 保存到全局状态
  saveActiveMenu(index)
}

// 处理菜单项点击，使用router.push进行路由跳转
const handleMenuItemClick = (path: string) => {
  console.log('菜单点击:', path)
  // 使用router.push进行路由跳转，确保路由变化能被Vue Router捕获
  router.push(path)
}

// 监听路由变化，更新激活的菜单
watch(() => route.path, (newPath) => {
  console.log('Route changed to:', newPath)
  
  // 提取标签页路径（第一级路径）
  const pathParts = newPath.split('/').filter(Boolean)
  const tabPath = pathParts.length > 0 ? `/${pathParts[0]}` : '/'
  console.log('Current tab path:', tabPath)
  
  // 检查当前路径是否是二级菜单（深度至少为2）
  const pathDepth = pathParts.length
  console.log('Path depth:', pathDepth)
  
  // 从全局状态获取保存的活动菜单项
  const savedMenu = globalActiveMenus[tabPath]
  console.log('Saved menu for tab:', savedMenu)
  
  if (pathDepth >= 2) {
    // 直接更新activeMenu，不需要等待nextTick
    console.log('Setting active menu to current path:', newPath)
    activeMenu.value = newPath
    // 保存到全局状态
    saveActiveMenu(newPath)
  } else {
    // 尝试从全局状态恢复之前的活动菜单项
    if (savedMenu) {
      console.log('Restoring saved menu:', savedMenu)
      activeMenu.value = savedMenu
      // 跳转到保存的菜单项对应的路径
      router.push(savedMenu)
    } else {
      // 如果没有保存的菜单项，默认激活当前标签页的第一个菜单项
      const firstMenuItem = currentMenuItems.value[0]
      if (firstMenuItem) {
        console.log('No saved menu, using first menu item:', firstMenuItem.path)
        activeMenu.value = firstMenuItem.path
        // 保存到全局状态
        saveActiveMenu(firstMenuItem.path)
        // 跳转到该菜单项对应的路径
        router.push(firstMenuItem.path)
      }
    }
  }
  
  console.log('Final active menu:', activeMenu.value)
  console.log('Global active menus after update:', globalActiveMenus)
})

// 获取路由数据
const fetchRoutes = async () => {
  try {
    console.log('Fetching routes from database...')
    // 从主进程获取路由配置
    const routesFromDb = await window.electronAPI.invoke<any[]>('api:routes:getAllNested')
    
    console.log('Routes from database:', routesFromDb)
    
    // 递归处理嵌套路由，提取所有菜单项，保持嵌套结构
    const extractMenuItems = (routes: any[]): MenuItem[] => {
      const items: MenuItem[] = []
      
      console.log('Processing routes for menu:', routes)
      
      for (const route of routes) {
        console.log('Processing route:', route.path)
        console.log('Route showInMenu:', route.showInMenu)
        console.log('Route icon:', route.icon)
        
        // 如果该路由显示在菜单中，添加到菜单列表
        if (route.showInMenu) {
          const menuItem: MenuItem = {
            path: route.path,
            title: route.title,
            icon: route.icon || 'i-carbon-home' // 添加默认图标
          }
          
          console.log('Creating menu item:', menuItem)
          
          // 处理子路由，递归提取
          if (route.children && route.children.length > 0) {
            console.log('Route has children:', route.children)
            menuItem.children = extractMenuItems(route.children)
            console.log('Menu item children:', menuItem.children)
          }
          
          items.push(menuItem)
          console.log('Added menu item to list:', menuItem)
        } else {
          console.log('Route not shown in menu:', route.path)
        }
      }
      
      return items
    }
    
    // 提取所有菜单项，保持嵌套结构
    const allItems = extractMenuItems(routesFromDb)
    console.log('All extracted menu items:', allItems)
    menuItems.value = allItems
    console.log('menuItems ref updated:', menuItems.value)
    
    // 强制触发UnoCSS检测和DOM更新
    nextTick(() => {
      console.log('DOM updated, forcing UnoCSS refresh')
      
      // 1. 重新应用UnoCSS样式
      if (window.__unocss) {
        window.__unocss.apply()
      }
      
      // 2. 检查并修复图标元素
      const menuItems = document.querySelectorAll('.el-menu-item')
      menuItems.forEach(item => {
        const icon = item.querySelector('i')
        if (icon) {
          console.log('Found icon element:', icon)
          console.log('Icon classes:', icon.className)
          
          // 确保图标可见
          icon.style.visibility = 'visible'
          icon.style.opacity = '1'
          icon.style.display = 'inline-block'
          
          // 添加一个强制重绘
          icon.offsetHeight
        }
      })
    })
    
    // 确保activeMenu正确设置
    if (currentMenuItems.value.length > 0) {
      console.log('Current menu items:', currentMenuItems.value)
      
      // 1. 首先检查当前路由路径是否对应一个菜单项
      console.log('Current route path:', route.path)
      
      // 检查当前路由是否是菜单项
      const currentRouteIsMenu = currentMenuItems.value.some(item => item.path === route.path)
      console.log('Current route is menu item:', currentRouteIsMenu)
      
      if (currentRouteIsMenu) {
        // 如果当前路由是菜单项，直接设置为activeMenu
        console.log('Setting active menu to current route:', route.path)
        activeMenu.value = route.path
        // 保存到全局状态
        saveActiveMenu(route.path)
        console.log('Active menu set to current route and saved:', activeMenu.value)
        return
      }
      
      // 2. 如果当前路由不是菜单项，尝试从全局状态恢复之前的活动菜单项
      const currentActiveMenu = getActiveMenu()
      console.log('Current active menu from global state:', currentActiveMenu)
      
      if (currentActiveMenu) {
        // 检查恢复的菜单项是否存在
        const menuExists = currentMenuItems.value.some(item => item.path === currentActiveMenu)
        console.log('Menu exists check:', menuExists)
        
        if (menuExists) {
          console.log('Restoring saved menu from global state:', currentActiveMenu)
          activeMenu.value = currentActiveMenu
          console.log('Active menu set to:', activeMenu.value)
          return
        }
      }
      
      // 3. 如果没有保存的菜单项或保存的菜单项不存在，默认激活第一个菜单项
      const firstMenuItem = currentMenuItems.value[0]
      if (firstMenuItem) {
        console.log('No saved menu or menu not found, using first menu item:', firstMenuItem.path)
        activeMenu.value = firstMenuItem.path
        // 保存到全局状态
        saveActiveMenu(firstMenuItem.path)
        console.log('Active menu set to first item and saved:', activeMenu.value)
      }
    }
    
    console.log('Final active menu after fetchRoutes:', activeMenu.value)
  } catch (error) {
    console.error('Failed to fetch routes:', error)
  }
}

// 组件挂载时获取路由数据
onMounted(() => {
  fetchRoutes()
})
</script>

<style scoped>
/* 左侧菜单样式 */
.regular-menu {
  width: 80px !important;
  height: 100% !important;
  background-color: #ffffff !important;
  border-right: 1px solid #e6e6e6 !important;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.05) !important;
  overflow-y: auto !important;
}

/* 移除Element Plus菜单的默认边框 */
.regular-menu :deep(.el-menu-vertical-demo) {
  border-right: none !important;
  background-color: transparent !important;
}

/* 设置菜单内边距 */
.regular-menu :deep(.el-menu) {
  padding: 15px 0 !important;
  background-color: transparent !important;
}

/* 菜单项样式 - 核心修复，添加!important确保样式生效 */
.regular-menu :deep(.el-menu-item) {
  /* 核心样式 - 居中布局 */
  width: 64px !important;
  height: 64px !important;
  /* 确保菜单项在菜单容器中水平居中 */
  margin: 0 auto 20px auto !important;
  /* 清除所有内边距 */
  padding: 0 !important;
  /* 清除Element Plus的默认padding */
  --el-menu-item-padding: 0 !important;
  border-radius: 10px !important;
  transition: all 0.3s ease !important;
  
  /* 重要：使用flex布局实现垂直居中 */
  display: flex !important;
  flex-direction: column !important;
  /* 确保内容水平居中 */
  align-items: center !important;
  /* 确保内容垂直居中 */
  justify-content: center !important;
  /* 文本居中 */
  text-align: center !important;
  
  /* 移除默认背景色 */
  background-color: transparent !important;
  
  /* 移除默认边框和阴影 */
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
  
  /* 行高重置 */
  line-height: 1 !important;
  
  /* 确保Element Plus的默认样式不影响 */
  position: relative !important;
  left: auto !important;
  right: auto !important;
}

/* 菜单项激活状态 */
.regular-menu :deep(.el-menu-item.is-active) {
  background-color: #409eff !important;
  color: white !important;
}

/* 菜单项悬停状态 */
.regular-menu :deep(.el-menu-item:hover) {
  background-color: #e6f7ff !important;
  color: #409eff !important;
}

/* 激活状态悬停 */
.regular-menu :deep(.el-menu-item.is-active:hover) {
  background-color: #66b1ff !important;
  color: white !important;
}

/* 图标样式 - 简化样式，移除自定义类 */
.regular-menu :deep(.el-menu-item i) {
  margin-right: 0 !important;
  margin-bottom: 6px !important;
  /* 图标大小调整为20px */
  font-size: 20px !important;
  line-height: 1 !important;
  display: inline-block !important;
  font-style: normal !important;
}

/* 文本样式 */
.regular-menu :deep(.el-menu-item span) {
  font-size: 11px !important;
  width: 100% !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
  line-height: 1 !important;
  text-align: center !important;
  padding: 0 !important;
  margin: 0 !important;
}

/* 确保内容容器正确渲染 - 核心修复 */
.regular-menu :deep(.el-menu-item__content) {
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
  width: 100% !important;
  height: 100% !important;
  padding: 0 !important;
  margin: 0 !important;
}

/* 移除子菜单指示器 */
.regular-menu :deep(.el-submenu__icon-arrow) {
  display: none !important;
}

/* 确保Element Plus的默认样式不影响我们的自定义样式 */
.regular-menu :deep(.el-menu) {
  border: none !important;
}

/* 移除菜单项的默认高亮边框 */
.regular-menu :deep(.el-menu-item.is-active::before) {
  display: none !important;
}

/* 移除菜单项的默认点击效果 */
.regular-menu :deep(.el-menu-item:active) {
  background-color: transparent !important;
}
</style>