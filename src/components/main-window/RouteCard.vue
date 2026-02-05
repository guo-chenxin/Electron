<template>
  <div 
    class="route-card" 
    :class="[{
      'root-route-card': isRoot,
      'menu-route-card': !isRoot,
      'active': isActive
    }]" 
    @click="handleClick"
  >
    <div class="route-card-header">
      <span class="route-card-icon" :class="icon || 'i-carbon-folder'"></span>
      <div class="route-card-title">
        <div class="main-title">{{ title || '未设置标题' }}</div>
        <div class="sub-title">{{ routePath || '未设置路由' }}</div>
      </div>
      <el-button 
        v-if="!isRoot" 
        type="danger" 
        size="small" 
        @click.stop="handleDelete"
        :disabled="isLastItem"
        class="delete-btn"
      >
        <span class="i-carbon-trash-can"></span>
      </el-button>
    </div>
    <div v-if="isRoot" class="route-card-body">
      <div class="route-info-item">
        <span class="label">描述：</span>
        <span class="value">{{ description || '无描述' }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  isRoot: boolean
  isActive: boolean
  title: string
  icon: string
  routePath: string
  description?: string
  isLastItem?: boolean
}>()

const emit = defineEmits<{
  click: []
  delete: []
}>()

const handleClick = () => {
  emit('click')
}

const handleDelete = () => {
  emit('delete')
}
</script>

<style scoped>
.route-card {
  background-color: white;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
  padding: 15px;
  margin-bottom: 15px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.route-card:hover {
  border-color: #409eff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.route-card.active {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
  background-color: #ecf5ff;
}

.root-route-card {
  margin-bottom: 25px;
}

.route-card-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  gap: 12px;
}

.route-card-icon {
  font-size: 20px;
  color: #409eff;
  font-style: normal;
}

.route-card-title {
  flex: 1;
  min-width: 0;
}

.main-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sub-title {
  font-size: 12px;
  color: #999;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.route-card-body {
  font-size: 12px;
}

.route-info-item {
  margin-bottom: 6px;
  display: flex;
  align-items: flex-start;
}

.route-info-item .label {
  color: #999;
  min-width: 40px;
  flex-shrink: 0;
}

.route-info-item .value {
  color: #666;
  flex: 1;
  word-break: break-word;
}

.menu-route-card {
  padding: 12px;
}

.menu-route-card .route-card-header {
  margin-bottom: 0;
}

.delete-btn {
  flex-shrink: 0;
}
</style>
