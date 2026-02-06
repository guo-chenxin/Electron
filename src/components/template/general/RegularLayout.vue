<template>
  <div class="regular-project-layout">
    <!-- 左侧菜单组件 - 只有当有菜单项时才显示 -->
    <RegularMenu v-if="hasVisibleMenus" />
    
    <!-- 右侧内容区域 -->
    <div class="right-content" :class="{ 'full-width': !hasVisibleMenus }">
      <!-- 根据路由动态渲染内容 -->
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import RegularMenu from './RegularMenu.vue'

// 添加electronAPI的类型声明
declare global {
  interface Window {
    electronAPI: {
      invoke: <T = any>(channel: string, ...args: any[]) => Promise<T>
    }
  }
}

const route = useRoute()
const hasVisibleMenus = ref(false)

// 检查当前路由对应的菜单是否有可见的子菜单项
const checkVisibleMenus = async () => {
  try {
    // 检查window.electronAPI是否存在
    if (!window.electronAPI) {
      hasVisibleMenus.value = false;
      return;
    }
    
    // 从主进程获取路由配置
    const routesFromDb = await window.electronAPI.invoke<any[]>('api:routes:getAllNested')
    
    // 提取当前路由的第一级路径
    const pathParts = route.path.split('/').filter(Boolean)
    const firstLevelPath = pathParts.length > 0 ? `/${pathParts[0]}` : '/'
    
    // 查找当前路由对应的菜单
    const findCurrentMenu = (routes: any[]): any => {
      for (const route of routes) {
        if (route.path === firstLevelPath) {
          return route
        }
        if (route.children && route.children.length > 0) {
          const found = findCurrentMenu(route.children)
          if (found) {
            return found
          }
        }
      }
      return null
    }
    
    const currentMenu = findCurrentMenu(routesFromDb)
    
    // 检查当前菜单是否有可见的子菜单项
    const hasVisibleChildMenus = (menu: any): boolean => {
      if (!menu || !menu.children || menu.children.length === 0) {
        return false
      }
      
      // 检查是否有子菜单项设置为显示
      return menu.children.some((child: any) => child.showInMenu)
    }
    
    const result = hasVisibleChildMenus(currentMenu)
    hasVisibleMenus.value = result
  } catch (error) {
    hasVisibleMenus.value = false
  }
}

// 监听路由变化，重新检查可见菜单
watch(() => route.path, () => {
  checkVisibleMenus()
})

// 组件挂载时检查可见菜单
onMounted(() => {
  checkVisibleMenus()
})
</script>

<style scoped>
.regular-project-layout {
  width: 100%;
  height: 100%;
  background-color: #f5f7fa;
  padding: 0;
  margin: 0;
  overflow: hidden;
  display: flex;
}

/* 右侧内容样式 - 默认布局 */
.right-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  min-height: 0;
}

/* 右侧内容样式 - 菜单隐藏时 */
.right-content.full-width {
  width: 100%;
  margin-left: 0;
  flex: none;
}
</style>