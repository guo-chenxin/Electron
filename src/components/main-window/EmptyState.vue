<template>
  <div class="empty-state">
    <div class="empty-content">
      <div class="icon-container">
        <span v-if="icon" class="empty-icon" :class="icon"></span>
      </div>
      <div class="text-container">
        <h2 class="empty-title">{{ title }}</h2>
        <p class="empty-description">{{ description }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">


// 定义props
const props = defineProps<{
  icon?: string // 图标变为可选
  title: string
  description: string
}>()
</script>

<style scoped>
/* 空状态样式 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  text-align: center;
  color: #909399;
}

/* 空状态内容容器 */
.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  justify-content: center;
}

/* 图标容器 - 固定高度，确保文本位置一致 */
.icon-container {
  height: 64px; /* 与图标大小相同 */
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.empty-icon {
  font-size: 64px;
  color: #c0c4cc;
}

.text-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  justify-content: center;
}

.empty-title {
  font-size: 18px;
  font-weight: bold;
  color: #606266;
  margin: 0;
}

.empty-description {
  font-size: 14px;
  color: #909399;
  line-height: 1.5;
  margin: 0;
}
</style>