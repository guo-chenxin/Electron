<template>
  <div class="default-view">
    <div class="default-content">
      <h1>页面未找到</h1>
      <p>当前路由没有对应的视图组件</p>
      <router-link to="/" class="go-home-btn">返回首页</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
// 默认视图组件，当路由找不到对应组件时显示
</script>

<style scoped>
.default-view {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  background-color: #f5f7fa;
}

.default-content {
  text-align: center;
  padding: 40px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.default-content h1 {
  font-size: 24px;
  color: #333;
  margin-bottom: 16px;
}

.default-content p {
  font-size: 16px;
  color: #666;
  margin-bottom: 24px;
}

.go-home-btn {
  display: inline-block;
  padding: 8px 16px;
  background-color: #409eff;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.go-home-btn:hover {
  background-color: #66b1ff;
}
</style>