<script setup lang="ts">
import Header from './components/layout/Header.vue'
</script>

<template>
  <div class="app-container">
    <!-- 顶部导航栏 -->
    <Header />
    
    <!-- 主内容区域 -->
    <div class="app-main">
      <!-- 路由视图，根据当前路由显示不同内容 -->
      <router-view />
    </div>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

#app {
  width: 100%;
  height: 100vh;
  overflow: hidden;
  margin: 0;
  padding: 0;
}

.app-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: visible;
  margin: 0;
  padding: 0;
}

.app-main {
  flex: 1;
  display: flex;
  overflow: hidden;
  margin: 0;
  padding: 0;
}
</style>
