<template>
  <div class="main-window-menu">
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
        <i :class="menu.icon"></i>
        <span>{{ menu.title }}</span>
      </el-menu-item>
    </el-menu>
  </div>
</template>

<script lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// 全局活动菜单状态，存储主窗口的活动菜单项（移到模块顶层，确保不被重置）
let globalActiveMenu: string = ''

export default {
  name: 'MainWindowMenu',
  setup() {

    // 定义菜单数据类型
    interface MenuItem {
      path: string
      title: string
      icon: string
      children?: MenuItem[]
    }

    const route = useRoute()
    const router = useRouter()
    const menuItems = ref<MenuItem[]>([])
    // 初始化activeMenu为空
    const activeMenu = ref('')

    // 保存活动菜单项到全局状态
    const saveActiveMenu = (menuPath: string) => {
      globalActiveMenu = menuPath
      console.log('Main window: Saved active menu:', menuPath)
      console.log('Main window: Global active menu:', globalActiveMenu)
    }

    // 从全局状态获取活动菜单项
    const getActiveMenu = () => {
      return globalActiveMenu || ''
    }

    // 从路由中获取当前激活标签页对应的菜单
    const currentMenuItems = computed(() => {
      // 检查当前路由路径，确定显示哪个标签页的菜单
      console.log('Current route path:', route.path)
      console.log('All menu items:', menuItems.value)
      
      // 显示主窗口的二级菜单
      const mainMenu = menuItems.value.find(item => item.path === '/')
      console.log('Main menu:', mainMenu)
      const result = mainMenu?.children || []
      console.log('Main menu children:', result)
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
      console.log('Main window: Route changed to:', newPath)
      
      // 检查当前路径是否是二级菜单（深度至少为2）
      const pathDepth = newPath.split('/').filter(Boolean).length
      console.log('Main window: Path depth:', pathDepth)
      
      if (pathDepth >= 2) {
        // 直接更新activeMenu，不需要等待nextTick
        console.log('Main window: Setting active menu to current path:', newPath)
        activeMenu.value = newPath
        // 保存到全局状态
        saveActiveMenu(newPath)
      } else {
        // 尝试从全局状态恢复之前的活动菜单项
        const savedMenu = getActiveMenu()
        console.log('Main window: Saved menu from global state:', savedMenu)
        
        if (savedMenu) {
          console.log('Main window: Restoring saved menu:', savedMenu)
          activeMenu.value = savedMenu
          // 跳转到保存的菜单项对应的路径
          router.push(savedMenu)
        } else {
          // 如果没有保存的菜单项，默认激活当前标签页的第一个菜单项
          const firstMenuItem = currentMenuItems.value[0]
          if (firstMenuItem) {
            console.log('Main window: No saved menu, using first menu item:', firstMenuItem.path)
            activeMenu.value = firstMenuItem.path
            // 保存到全局状态
            saveActiveMenu(firstMenuItem.path)
            // 跳转到该菜单项对应的路径
            router.push(firstMenuItem.path)
          }
        }
      }
      
      console.log('Main window: Final active menu:', activeMenu.value)
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
            
            // 如果该路由显示在菜单中，添加到菜单列表
            if (route.showInMenu) {
              const menuItem: MenuItem = {
                path: route.path,
                title: route.title,
                icon: route.icon
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
        
        // 强制触发重排，确保UnoCSS能检测到新添加的图标类名
        nextTick(() => {
          // 1. 先确保所有菜单项都已经渲染到DOM中
          // 2. 然后为所有图标添加一个短暂的class来触发UnoCSS检测
          const menuItems = document.querySelectorAll('.el-menu-item')
          menuItems.forEach(item => {
            const icon = item.querySelector('i')
            if (icon) {
              // 强制重绘和回流，确保UnoCSS能检测到图标类名
              icon.style.opacity = '0'
              icon.offsetHeight // 触发回流
              setTimeout(() => {
                icon.style.opacity = '1'
              }, 0)
            }
          })
        })
        
        // 确保activeMenu正确设置
        if (currentMenuItems.value.length > 0) {
          console.log('Main window: Current menu items:', currentMenuItems.value)
          
          // 1. 首先检查当前路由路径是否对应一个菜单项
          console.log('Main window: Current route path:', route.path)
          
          // 检查当前路由是否是菜单项
          const currentRouteIsMenu = currentMenuItems.value.some(item => item.path === route.path)
          console.log('Main window: Current route is menu item:', currentRouteIsMenu)
          
          if (currentRouteIsMenu) {
            // 如果当前路由是菜单项，直接设置为activeMenu
            console.log('Main window: Setting active menu to current route:', route.path)
            activeMenu.value = route.path
            // 保存到全局状态
            saveActiveMenu(route.path)
            return
          }
          
          // 2. 如果当前路由不是菜单项，尝试从全局状态恢复之前的活动菜单项
          const currentActiveMenu = getActiveMenu()
          console.log('Main window: Current active menu from global state:', currentActiveMenu)
          
          if (currentActiveMenu) {
            // 检查恢复的菜单项是否存在
            const menuExists = currentMenuItems.value.some(item => item.path === currentActiveMenu)
            console.log('Main window: Menu exists check:', menuExists)
            
            if (menuExists) {
              console.log('Main window: Restoring saved menu from global state:', currentActiveMenu)
              activeMenu.value = currentActiveMenu
              return
            }
          }
          
          // 3. 如果没有保存的菜单项或保存的菜单项不存在，默认激活第一个菜单项
          const firstMenuItem = currentMenuItems.value[0]
          if (firstMenuItem) {
            console.log('Main window: No saved menu or menu not found, using first menu item:', firstMenuItem.path)
            activeMenu.value = firstMenuItem.path
            // 保存到全局状态
            saveActiveMenu(firstMenuItem.path)
          }
        }
      } catch (error) {
        console.error('Failed to fetch routes:', error)
      }
    }

    // 组件挂载时获取路由数据
    onMounted(() => {
      fetchRoutes()
    })

    return {
      activeMenu,
      flattenedMenuItems,
      handleMenuSelect,
      handleMenuItemClick
    }
  }
}
</script>

<style scoped>
/* 左侧菜单样式 */
.main-window-menu {
  width: 200px;
  height: 100%;
  background-color: #ffffff;
  border-right: 1px solid #e6e6e6;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.05);
  overflow-y: auto;
}

/* 移除Element Plus菜单的默认边框，避免双重边框 */
.main-window-menu :deep(.el-menu-vertical-demo) {
  border-right: none;
}

/* 图标间距 */
.main-window-menu :deep(.el-menu-item i[class^="i-carbon-"]) {
  margin-right: 8px;
}
</style>