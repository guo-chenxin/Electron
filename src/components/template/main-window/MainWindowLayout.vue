<template>
  <div class="main-window-layout">
    <!-- 左侧菜单组件 -->
    <MainWindowMenu />
    
    <!-- 右侧内容区域 -->
    <div class="right-content">
      <!-- 根据路由动态渲染内容 -->
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import MainWindowMenu from './MainWindowMenu.vue'
</script>

<style scoped>
.main-window-layout {
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