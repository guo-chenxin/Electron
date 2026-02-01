<template>
  <div class="not-found">
    <h1>404 - 页面不存在</h1>
    <p>您访问的页面不存在，请检查您的URL是否正确。</p>
    <el-button type="primary" @click="goHome">返回首页</el-button>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
  router.push('/')
}
</script>

<style scoped>
.not-found {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  text-align: center;
  padding: 20px;
}

.not-found h1 {
  font-size: 48px;
  color: #ff4d4f;
  margin-bottom: 20px;
}

.not-found p {
  font-size: 18px;
  color: #666;
  margin-bottom: 30px;
}
</style>