<template>
  <el-card 
    class="project-card" 
    shadow="hover"
    @click="handleClick"
  >
    <!-- 收藏指示器 -->
    <div v-if="isFavorite" class="favorite-indicator"></div>
    
    <div class="card-content">
      <span class="card-icon" :class="icon || 'i-carbon-folder'"></span>
      <h2 class="card-title">{{ title }}</h2>
      <p class="card-description">{{ description }}</p>
    </div>
  </el-card>
</template>

<script setup lang="ts">


// 定义props
const props = defineProps<{
  title: string
  description: string
  icon?: string
  isFavorite?: boolean
}>()

// 定义事件
const emit = defineEmits<{
  click: []
}>()

// 处理卡片点击
const handleClick = () => {
  emit('click')
}
</script>

<style scoped>
.project-card {
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border-radius: 10px;
  height: 100%;
  min-height: 220px;
  position: relative;
}

/* 收藏指示器 */
.favorite-indicator {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 10px;
  height: 10px;
  background-color: #fadb14;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  animation: pulse 2s infinite;
}

/* 收藏指示器动画 */
@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.project-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.card-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 25px 20px;
  text-align: center;
  height: 100%;
}

.card-icon {
  font-size: 40px;
  color: #409eff;
  margin-bottom: 15px;
}

.card-title {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 8px;
  word-break: break-word;
}

.card-description {
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
  margin: 0;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  word-break: break-word;
}
</style>