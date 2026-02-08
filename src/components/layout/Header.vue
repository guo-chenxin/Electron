<template>
<div class="app-header">
  <div class="title-bar">
    <div class="left">
      <div class="app-name">
        <i class="i-carbon-blog"></i>
        <span class="app-text">Electron</span>
      </div>
    </div>
    <!-- 只在非登录页面显示标签页 -->
    <div class="center" v-if="!isLoginPage">
      <div class="tabs">
        <!-- 动态生成标签页 -->
        <div 
          v-for="route in tabRoutes" 
          :key="route.path"
          class="tab" 
          :class="{ 
            active: $route.path === route.path || ($route.path.startsWith(route.path + '/')) || 
                   (route.path === '/' && $route.path.startsWith('/main/')) 
          }"
          @click="switchToTab(route.path)"
        >
          <span class="tab-content">
              <!-- 使用动态class绑定，确保图标显示 -->
              <i class="icon" :class="route.icon"></i>
              <span class="tab-text">{{ route.title }}</span>
            </span>
          <!-- 主窗口标签不需要关闭按钮 -->
          <button 
            v-if="route.path !== '/'"
            class="tab-close-btn" 
            @click.stop="closeTab(route.path)"
          >×</button>
        </div>
      </div>
    </div>
    <!-- 登录页面时，center部分为空 -->
    <div class="center" v-else>
      <div class="empty-center"></div>
    </div>
    <div class="right">
          <!-- 窗口控制按钮，使用flex-grow确保始终靠右 -->
          <div class="flex-spacer"></div>
          
          <!-- 登录状态下显示的设置和用户菜单 -->
          <div class="settings-group" v-if="isLoggedIn">
            <div class="icons-group">
              <button class="btn window-btn" title="刷新">
                <span class="i-carbon-renew"></span>
              </button>
              <button class="btn window-btn" title="设置">
                <span class="i-carbon-settings"></span>
              </button>
              <button class="btn window-btn" title="通知">
                <span class="i-carbon-notification"></span>
              </button>
            </div>
            <!-- 用户菜单 -->
            <ElDropdown trigger="hover" :popper-options="{ modifiers: [{ name: 'computeStyles', options: { adaptive: false } }] }">
              <button class="btn window-btn user-btn">
                <ElAvatar :size="24" :src="currentUser?.avatarUrl || ''" :icon="defaultAvatar" />
              </button>
              <template #dropdown>
                <ElDropdownMenu>
                  <ElDropdownItem @click="openAccountSettings">
                    <span class="i-carbon-settings"></span> 账号设置
                  </ElDropdownItem>
                  <ElDropdownItem @click="handleLogout">
                    <span class="i-carbon-port-output"></span> 退出登录
                  </ElDropdownItem>
                </ElDropdownMenu>
              </template>
            </ElDropdown>
          </div>
          
          <!-- 窗口控制按钮 -->
          <div class="window-controls-group">
            <button class="btn window-btn pin-btn" :title="isPinned ? '取消置顶' : '置顶'" @click="toggleWindowPin">
              <span class="i-carbon-pin" :style="{ transform: isPinned ? 'rotate(-45deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }"></span>
            </button>
            <button class="btn window-btn minimize-btn" @click="minimizeWindow">
              <span class="i-carbon-subtract"></span>
            </button>
            <button class="btn window-btn maximize-btn" @click="maximizeWindow">
              <span class="i-carbon-checkbox"></span>
            </button>
            <button class="btn window-btn close-btn" @click="closeWindow">
              <span class="i-carbon-close"></span>
            </button>
          </div>
        </div>
  </div>
</div>
  
  <!-- 账号设置弹窗 -->
  <AccountSettings 
    v-if="showAccountSettings" 
    @close="closeAccountSettings" 
  />
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElAvatar, ElDropdown, ElDropdownMenu, ElDropdownItem, ElIcon, ElMessageBox } from 'element-plus';
import { User as UserIcon } from '@element-plus/icons-vue';
import { useAuth } from '@/composables/useAuth';
import { useTabs } from '@/composables/useTabs';
import AccountSettings from '../account/AccountSettings.vue';

// 默认头像图标
const defaultAvatar = UserIcon;

const router = useRouter();
const route = useRoute();
const { logout, isLoggedIn, currentUser } = useAuth();
const { openTabs, lastVisitedPaths, tabRoutes, closeTab, resetTabs } = useTabs();

// 判断是否是登录页面
const isLoginPage = computed(() => route.path === '/login');

// 窗口置顶状态
const isPinned = ref(false);
// 账号设置弹窗显示状态
const showAccountSettings = ref(false);

// 打开账号设置
const openAccountSettings = () => {
  showAccountSettings.value = true;
};

// 关闭账号设置
const closeAccountSettings = () => {
  showAccountSettings.value = false;
};

// 切换标签页
const switchToTab = (path) => {
  // 跳转到该标签页的最后访问路径
  // 如果没有最后访问路径，跳转到标签页路径
  const targetPath = lastVisitedPaths.value[path] || path;
  router.push(targetPath);
};

// 退出登录处理
const handleLogout = async () => {
  await logout();
  // 退出登录后重置标签页，只保留主窗口标签
  resetTabs();
  // 跳转到登录页面
  router.push('/login');
};

const minimizeWindow = () => {
  window.electronAPI?.windowMinimize();
};

const maximizeWindow = () => {
  window.electronAPI?.windowMaximize();
};

const toggleWindowPin = () => {
  window.electronAPI?.windowTogglePin();
  // 切换置顶状态
  isPinned.value = !isPinned.value;
};

const closeWindow = () => {
  window.electronAPI?.windowClose();
};
</script>

<style scoped>
/* 移除MessageBox按钮的点击边框 */
:deep(.el-message-box__btns .el-button) {
  outline: none !important;
  box-shadow: none !important;
}

:deep(.el-message-box__btns .el-button:focus),
:deep(.el-message-box__btns .el-button:active),
:deep(.el-message-box__btns .el-button:focus-visible) {
  outline: none !important;
  box-shadow: none !important;
}
.app-header {
  width: 100%;
  height: 36px;
  background: white;
  border-bottom: 1px solid #e8e8e8;
  overflow: visible;
  position: relative;
  z-index: 100;
}

.title-bar {
  display: flex;
  align-items: center;
  height: 100%;
  padding: 0 8px;
  width: 100%;
  overflow: visible;
  -webkit-app-region: drag;
  position: relative;
  z-index: 100;
}

/* 只有实际可交互元素不能拖动，其他元素继承 title-bar 的 drag 属性 */
.tab,
.tab-close-btn,
.btn,
.el-dropdown,
.el-avatar {
  -webkit-app-region: no-drag !important;
  position: relative;
  z-index: 1;
}

.left {
  display: flex;
  align-items: center;
  padding: 0 0 0 5px;
  justify-content: flex-start;
}

.app-name {
  display: flex;
  align-items: center;
  gap: 2px;
}

/* 应用文本样式 */
.app-text {
  font-size: 14px;
  font-weight: bold;
  color: rgba(0, 0, 0, 0.3);
  font-family: 'Arial', sans-serif;
}

/* 确保blog图标颜色与文本一致 */
.app-name i[class^="i-carbon-"] {
  color: rgba(0, 0, 0, 0.3);
  font-size: 20px;
}

.center {
  flex: 1;
  margin: 0 10px;
  min-width: 0;
}

.right {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 200px;
  justify-content: flex-start;
  flex: 1;
}

/* 弹性间隔，用于将窗口控制按钮推到最右侧 */
.flex-spacer {
  flex-grow: 1;
}

/* 设置组样式 */
.settings-group {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-right: 8px;
}

/* 图标组样式 - 一行显示多个按钮 */
.icons-group {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

/* 窗口控制按钮组样式 - 一行显示多个按钮 */
.window-controls-group {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

/* 按钮组通用样式 */
.btn-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.btn-group .btn {
  flex: 1;
  min-width: 36px;
}

.tabs {
  display: flex;
  gap: 8px;
  height: 36px;
  overflow: hidden;
  padding: 2px 0 2px 8px;
}

.tab {
    padding: 4px 6px 4px 8px;
    line-height: 24px;
    background: #f5f7fa;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    margin: 2px 0;
    display: flex;
    align-items: center;
    gap: 4px;
    user-select: none;
    transition: background-color 0.2s;
  }

  .tab:hover {
    background: #e6f2ff;
  }

/* 标签页内容样式 */
.tab-content {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 标签页图标样式 */
.tab-content .icon {
  margin-right: 2px;
  display: inline-block;
  width: 14px;
  font-size: 14px;
  color: inherit;
  /* 确保图标能正确显示 */
  font-style: normal;
  line-height: 1;
}

/* 标签页文本样式 */
.tab-text {
  display: inline-block;
}

/* 标签页关闭按钮样式 - 完全覆盖全局button样式 */
.tab-close-btn {
  cursor: pointer;
  font-size: 13px;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s; /* 只保留背景色过渡 */
  background: transparent;
  border: none !important; /* 强制移除边框 */
  border-color: transparent !important; /* 确保边框颜色透明 */
  padding: 0;
  margin: 0;
  line-height: 16px;
  box-sizing: border-box;
  text-align: center;
  vertical-align: middle;
  flex-shrink: 0;
  position: relative;
  outline: none;
  box-shadow: none;
  font-family: inherit; /* 继承字体 */
  font-weight: normal; /* 重置字体粗细 */
}

.tab-close-btn:hover {
  background: rgba(0, 0, 0, 0.15);
}

.tab.active .tab-close-btn:hover {
  background: rgba(255, 255, 255, 0.25);
}

/* 确保按钮在各种状态下都没有边框和轮廓 */
.tab-close-btn:focus,
.tab-close-btn:active,
.tab-close-btn:focus-visible {
  outline: none;
  border: none;
  box-shadow: none;
}

.tab.active {
  background: #409eff;
  color: white;
}

/* 确保激活标签页中的Carbon图标可见 - 同时支持span和i标签 */
.tab.active .tab-content span[class^="i-carbon-"] {
  color: white !important;
}

.tab.active .tab-content i[class^="i-carbon-"] {
  color: white !important;
}

.btn {
  padding: 0;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 16px;
  border-radius: 4px;
  -webkit-app-region: no-drag;
  width: 36px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  transition: background-color 0.2s;
  outline: none;
}

.btn:hover {
  background: #e0e0e0;
  transition: background-color 0.2s ease;
}

.btn:focus,
.btn:active {
  outline: none;
  border: none;
  box-shadow: none;
}

/* 统一窗口控制按钮样式 */
.window-btn {
  padding: 0;
  margin: 0;
  min-width: 36px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* Element Plus图标容器样式 */
.window-btn :deep(.el-icon) {
  width: 16px;
  height: 16px;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 直接设置svg元素的尺寸 */
.window-btn :deep(svg) {
  width: 16px;
  height: 16px;
  font-size: 16px;
}

/* 调整Carbon图标大小 - 整体调小 */
.window-btn span[class^="i-carbon-"] {
  font-size: 14px;
}

/* 最小化图标大一点，但整体还是比之前小 */
.minimize-btn span[class^="i-carbon-"] {
  font-size: 16px;
}

/* 全屏图标小一点，保持比例 */
.maximize-btn span[class^="i-carbon-"] {
  font-size: 12px;
}

/* 下拉菜单项中图标与文本的间距 - 使用更具体的选择器 */
:deep(.el-dropdown-menu__item) span[class^="i-carbon-"] {
  margin-right: 8px !important;
  display: inline-block;
  width: 16px;
}

/* ElementPlus图标样式 */
.left :deep(.el-icon) {
  width: 24px;
  height: 24px;
  font-size: 24px;
  color: rgba(0, 0, 0, 0.3);
}

/* ElementPlus图标SVG样式 */
.left :deep(svg) {
  width: 24px;
  height: 24px;
  font-size: 24px;
  color: rgba(0, 0, 0, 0.3);
}

/* 用户名称样式 */
.user-name {
  margin-left: 8px;
  font-size: 12px;
  font-weight: 500;
  color: #333;
}

/* 关闭按钮悬停效果 */
.close-btn:hover {
  background: #ff4d4f;
  color: white;
}
</style>