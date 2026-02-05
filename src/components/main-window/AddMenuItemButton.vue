<template>
  <div class="add-menu-item-btn" @click="handleClick">
    <div class="add-menu-item-content">
      <span class="i-carbon-add"></span>
      <span>{{ label }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label?: string
}>()

const emit = defineEmits<{
  click: []
}>()

const handleClick = () => {
  emit('click')
}
</script>

<style scoped>
.add-menu-item-btn {
  margin-top: 10px;
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: #fafafa;
}

.add-menu-item-btn:hover {
  border-color: #409eff;
  background-color: #ecf5ff;
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.15);
}

.add-menu-item-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #999;
  font-size: 14px;
}

.add-menu-item-content span.i-carbon-add {
  font-size: 16px;
}

.add-menu-item-btn:hover .add-menu-item-content {
  color: #409eff;
}
</style>
