<template>
  <div class="regular-project-layout">
    <!-- 左侧菜单组件 -->
    <RegularMenu />
    
    <!-- 右侧内容区域 -->
    <div class="right-content">
      <!-- 根据路由动态渲染内容 -->
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuth } from '../../composables/useAuth'
import RegularMenu from './RegularMenu.vue'

const { isLoggedIn } = useAuth()
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
</style>