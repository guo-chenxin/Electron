<template>
  <div v-if="visible" class="dialog-overlay" @click="handleOverlayClick">
    <div class="dialog-content" @click.stop>
      <!-- 对话框内容 -->
      <div class="dialog-body">
        <!-- 关闭按钮 -->
        <div class="dialog-close-wrapper">
          <button class="dialog-close-btn" @click="handleClose" title="关闭">
            <span class="i-carbon-close"></span>
          </button>
        </div>
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

// 处理关闭按钮点击
const handleClose = () => {
  emit('close')
}

// 处理遮罩层点击
const handleOverlayClick = () => {
  emit('close')
}
</script>

<style scoped>
/* 遮罩层样式 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 对话框容器 */
.dialog-content {
  display: flex;
  flex-direction: column;
  width: min(900px, 90vw);
  height: min(650px, 80vh);
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from { transform: translateY(-20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

/* 对话框内容区域 */
.dialog-body {
  flex: 1;
  padding: 0;
  overflow: hidden;
  position: relative;
}

/* 关闭按钮容器 */
.dialog-close-wrapper {
  position: absolute;
  top: 10px;
  right: 12px;
  z-index: 100;
  background-color: white;
  border-radius: 4px;
  padding: 2px;
}

/* 关闭按钮样式 */
.dialog-close-btn {
  background: transparent;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 0;
  border-radius: 0;
  color: #999;
  outline: none;
  box-shadow: none;
  width: auto;
  height: auto;
  min-width: auto;
  line-height: 1;
}

.dialog-close-btn:hover {
  background-color: transparent;
  color: #666;
  box-shadow: none !important;
  transform: none;
}

.dialog-close-btn:focus,
.dialog-close-btn:active,
.dialog-close-btn:focus-visible {
  outline: none !important;
  box-shadow: none !important;
  background-color: transparent !important;
}

/* 图标样式 */
.dialog-close-btn span {
  display: inline-block;
  padding: 4px;
  transition: color 0.2s ease;
  font-style: normal;
}



/* 响应式调整 */
@media (max-width: 768px) {
  .dialog-content {
    width: min(95vw, 600px);
    max-height: min(85vh, 500px);
  }
}
</style>