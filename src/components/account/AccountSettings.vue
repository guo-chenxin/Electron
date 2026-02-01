<template>
  <div class="account-settings-overlay" @click="closeSettings">
    <div class="account-settings-dialog" @click.stop>
      <!-- 左侧菜单 -->
      <div class="left-menu">
        <div class="menu-content">
          <!-- 菜单分组渲染 -->
          <div 
            v-for="group in menuGroups" 
            :key="group.title" 
            class="menu-section"
          >
            <div class="section-title">{{ group.title }}</div>
            <ul class="menu-list">
              <li 
                v-for="item in group.items" 
                :key="item.id"
                class="menu-item" 
                :class="{ active: activeTab === item.id }"
                @click="handleTabClick(item)"
              >
                <span :class="item.icon"></span>
                <span>{{ item.label }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      <!-- 右侧内容 -->
      <div class="right-content">
        <div class="content-header">
          <h4>{{ tabTitles[activeTab] }}</h4>
          <button class="close-btn" @click="closeSettings">
            <span class="i-carbon-close"></span>
          </button>
        </div>
        <div class="content-body">
          <!-- 动态渲染所有设置面板 -->
          <template v-if="activeTab === 'basic'">
            <div class="setting-panel">
              <div class="setting-group">
                <label class="setting-label">用户名</label>
                <div class="setting-value">{{ currentUser?.username || '未设置' }}</div>
              </div>
              <div class="setting-group">
                <label class="setting-label">邮箱</label>
                <div class="setting-value">{{ currentUser?.email || '未设置' }}</div>
              </div>
              <div class="setting-group">
                <label class="setting-label">创建时间</label>
                <div class="setting-value">{{ formatDate(currentUser?.createdAt) }}</div>
              </div>
            </div>
          </template>
          
          <!-- 使用computed属性渲染激活的面板 -->
          <template v-else-if="activePanel">
            <div class="setting-panel">
              <div class="setting-group">
                <label class="setting-label">{{ activePanel.title }}</label>
                <div class="setting-value">{{ activePanel.content }}</div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useRouter } from 'vue-router'
import { useTabs } from '@/composables/useTabs'
import { ElMessageBox } from 'element-plus'

const emit = defineEmits<{
  close: []
}>()

const router = useRouter()
const { currentUser, logout } = useAuth()
const { resetTabs } = useTabs()

// 定义activeTab的类型为字符串
const activeTab = ref('basic')

// 标签页标题映射，添加索引签名
const tabTitles: Record<string, string> = {
  basic: '基本设置',
  notification: '通知',
  appearance: '外观',
  language: '语言和区域',
  general: '通用',
  shortcut: '快捷键',
  about: '关于Electron'
}

// 计算当前激活的面板
const activePanel = computed(() => {
  return settingPanels.find(panel => panel.id === activeTab.value)
})

// 定义菜单项类型
interface MenuItem {
  id: string;
  label: string;
  icon: string;
}

// 定义菜单分组类型
interface MenuGroup {
  title: string;
  items: MenuItem[];
}

// 定义设置面板类型
interface SettingPanel {
  id: string;
  title: string;
  content: string;
}

// 定义菜单分组数据结构
const menuGroups: MenuGroup[] = [
  {
    title: '账号信息',
    items: [
      {
        id: 'basic',
        label: '基本设置',
        icon: 'i-carbon-user'
      },
      {
        id: 'notification',
        label: '通知',
        icon: 'i-carbon-notification'
      }
    ]
  },
  {
    title: '偏好设置',
    items: [
      {
        id: 'appearance',
        label: '外观',
        icon: 'i-carbon-color-palette'
      },
      {
        id: 'language',
        label: '语言和区域',
        icon: 'i-carbon-translate'
      },
      {
        id: 'general',
        label: '通用',
        icon: 'i-carbon-settings'
      },
      {
        id: 'shortcut',
        label: '快捷键',
        icon: 'i-carbon-keyboard'
      },
      {
        id: 'about',
        label: '关于Electron',
        icon: 'i-carbon-information'
      },
      {
        id: 'logout',
        label: '退出登录',
        icon: 'i-carbon-port-output'
      }
    ]
  }
]

// 定义设置面板数据结构
const settingPanels: SettingPanel[] = [
  {
    id: 'notification',
    title: '通知设置',
    content: '通知设置内容'
  },
  {
    id: 'appearance',
    title: '外观设置',
    content: '外观设置内容'
  },
  {
    id: 'language',
    title: '语言和区域设置',
    content: '语言和区域设置内容'
  },
  {
    id: 'general',
    title: '通用设置',
    content: '通用设置内容'
  },
  {
    id: 'shortcut',
    title: '快捷键设置',
    content: '快捷键设置内容'
  },
  {
    id: 'about',
    title: '关于Electron',
    content: '关于Electron内容'
  }
]

// 关闭设置弹窗
const closeSettings = () => {
  emit('close')
}

// 格式化日期
const formatDate = (dateString?: string) => {
  if (!dateString) return '未设置'
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN')
}

// 处理退出登录
const handleLogout = async () => {
  try {
    // 显示确认弹窗
    await ElMessageBox.confirm(
      '确认退出登录?',
      '',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 用户确认后执行退出登录
    await logout()
    resetTabs()
    closeSettings()
    router.push('/login')
  } catch (error) {
    // 用户取消退出登录
    return
  }
}

// 处理标签页点击
const handleTabClick = (item: any) => {
  // 如果是退出登录项，执行退出登录逻辑
  if (item.id === 'logout') {
    handleLogout()
    return
  }
  
  // 否则切换标签页
  activeTab.value = item.id
}
</script>

<style scoped>
.account-settings-overlay {
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

.account-settings-dialog {
  display: flex;
  width: 900px;
  height: 650px;
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

/* 左侧菜单样式 */
.left-menu {
  width: 220px;
  background-color: #f5f7fa;
  border-right: 1px solid #e8e8e8;
  display: flex;
  flex-direction: column;
}

.menu-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px 0;
}

/* 菜单分类样式 */
.menu-section {
  margin-bottom: 16px;
}

.section-title {
  padding: 0 20px;
  font-size: 12px;
  font-weight: 600;
  color: #999;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* 菜单项样式 */
.menu-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 10px 20px;
  cursor: pointer;
  gap: 10px;
  color: #555;
  font-size: 14px;
  border-radius: 0 30px 30px 0;
  margin-right: 8px;
}

/* 移除选中项的背景色 */
.menu-item.active {
  background-color: transparent;
  color: #555;
}

.menu-item span:first-child {
  font-size: 16px;
  width: 18px;
  text-align: center;
}

/* 滚动条样式 */
.menu-content::-webkit-scrollbar {
  width: 6px;
}

.menu-content::-webkit-scrollbar-track {
  background: transparent;
}

.menu-content::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

.menu-content::-webkit-scrollbar-thumb:hover {
  background: #999;
}

/* 右侧内容样式 */
.right-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid #e8e8e8;
  min-height: auto;
}

.content-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.close-btn {
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

.close-btn:hover {
  background-color: transparent;
  color: #666;
  box-shadow: none !important;
  transform: none;
}

.close-btn:focus,
.close-btn:active,
.close-btn:focus-visible {
  outline: none !important;
  box-shadow: none !important;
  background-color: transparent !important;
}

/* 确保图标元素样式 */
.close-btn span {
  display: inline-block;
  padding: 4px;
  outline: none;
  box-shadow: none;
  transition: color 0.2s ease;
}

.close-btn:hover span {
  color: #666;
}

.content-body {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

/* 基本设置样式 */
.basic-settings {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.setting-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.setting-label {
  font-size: 13px;
  color: #999;
  font-weight: 400;
}

.setting-value {
  font-size: 14px;
  color: #333;
  padding: 8px 12px;
  background-color: #f9f9f9;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
}
</style>