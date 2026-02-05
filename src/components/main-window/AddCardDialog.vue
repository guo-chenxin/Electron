<template>
  <div v-if="visible" class="add-project-overlay" @click="handleClose">
    <div class="add-project-dialog" @click.stop>
      <!-- 自定义关闭按钮 -->
      <div class="dialog-close-wrapper">
        <button class="dialog-close-btn" @click="handleClose" title="关闭">
          <span class="i-carbon-close"></span>
        </button>
      </div>
      
      <!-- 左侧路由卡片区域 -->
      <div class="left-panel">
        <div class="panel-header">
          <h3>路由管理</h3>
        </div>
        
        <!-- 项目根路由卡片 -->
        <RouteCard 
          :is-root="true"
          :is-active="selectedItem.type === 'root'"
          :title="projectForm.title"
          :icon="projectForm.icon"
          :route-path="projectForm.routePath"
          :description="projectForm.description"
          @click="selectItem('root', null)"
        />
        
        <!-- 菜单路由卡片列表 -->
        <div class="menu-routes-section">
          <div class="section-title">菜单路由</div>
          
          <div v-if="projectForm.menuItems.length > 0" class="menu-routes-list">
            <RouteCard 
              v-for="(menuItem, index) in projectForm.menuItems" 
              :key="index"
              :is-root="false"
              :is-active="selectedItem.type === 'menu' && selectedItem.index === index"
              :title="menuItem.title"
              :icon="menuItem.icon"
              :route-path="menuItem.routePath"
              :is-last-item="projectForm.menuItems.length <= 1"
              @click="selectItem('menu', index)"
              @delete="removeMenuItem(index)"
            />
            
            <!-- 添加菜单项的虚线加号框 -->
            <AddMenuItemButton 
              label="添加菜单项"
              @click="addMenuItem"
            />
          </div>
          
          <!-- 提示信息 - 当没有菜单项时显示 -->
          <div v-else class="no-menu-items-tip">
            <AddMenuItemButton 
              label="添加菜单项"
              @click="addMenuItem"
            />
          </div>
        </div>
      </div>
      
      <!-- 右侧详细设置区域 -->
      <div class="right-panel">
        <div class="panel-content">
          <div class="panel-header">
            <h3>{{ selectedItem.type === 'root' ? '根路由设置' : '菜单路由设置' }}</h3>
          </div>
          
          <!-- 根路由设置 -->
          <el-form v-if="selectedItem.type === 'root'" :model="projectForm" label-width="100px" :rules="projectFormRules" ref="formRef">
            <el-form-item label="项目标题" prop="title">
              <el-input v-model="projectForm.title" placeholder="请输入项目标题" />
            </el-form-item>
            
            <el-form-item label="项目描述" prop="description">
              <el-input v-model="projectForm.description" type="textarea" placeholder="请输入项目描述" :rows="3" />
            </el-form-item>
            
            <el-form-item label="项目图标" prop="icon">
              <el-select v-model="projectForm.icon" placeholder="请选择项目图标" popper-class="icon-grid-select-popper">
                <template #prefix>
                  <span class="selected-icon" :class="projectForm.icon"></span>
                </template>
                <el-option v-for="icon in iconList" :key="icon.value" :value="icon.value">
                  <div class="icon-grid-item">
                    <span class="icon-grid-preview" :class="icon.value"></span>
                    <span class="icon-grid-label">{{ icon.label }}</span>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>
            
            <el-form-item label="根路由" prop="routePath">
              <el-input v-model="projectForm.routePath" placeholder="请输入根路由，例如：/***" />
            </el-form-item>
            
            <el-form-item label="重定向" prop="redirect">
              <el-input v-model="projectForm.redirect" placeholder="请输入重定向路径，例如：/***/***" />
            </el-form-item>
            
            <el-form-item label="显示设置" prop="showInMenu" class="switch-form-item">
              <div class="switch-group">
                <div class="switch-item">
                  <span class="switch-label">显示在菜单</span>
                  <el-switch v-model="projectForm.showInMenu" disabled />
                </div>
                <div class="switch-item">
                  <span class="switch-label">显示在标签页</span>
                  <el-switch v-model="projectForm.showInTabs" disabled />
                </div>
              </div>
            </el-form-item>
            
            <el-form-item label="认证设置" prop="requiresAuth" class="switch-form-item">
              <div class="switch-group">
                <div class="switch-item">
                  <span class="switch-label">需要认证</span>
                  <el-switch v-model="projectForm.requiresAuth" />
                </div>
              </div>
            </el-form-item>
            
            <el-form-item label="菜单顺序" prop="order">
              <el-input-number v-model="projectForm.order" :min="0" :max="999" />
            </el-form-item>
          </el-form>
          
          <!-- 菜单项设置 -->
          <el-form v-else-if="selectedItem.type === 'menu' && selectedItem.index !== null" :model="projectForm.menuItems[selectedItem.index]" label-width="80px" :rules="menuItemFormRules" ref="menuFormRef">
            <el-form-item label="标题" prop="title">
              <el-input v-model="projectForm.menuItems[selectedItem.index].title" placeholder="请输入菜单项标题" />
            </el-form-item>
            
            <el-form-item label="图标" prop="icon">
              <el-select v-model="projectForm.menuItems[selectedItem.index].icon" placeholder="请选择菜单项图标" popper-class="icon-grid-select-popper">
                <template #prefix>
                  <span class="selected-icon" :class="projectForm.menuItems[selectedItem.index].icon"></span>
                </template>
                <el-option v-for="icon in iconList" :key="icon.value" :value="icon.value">
                  <div class="icon-grid-item">
                    <span class="icon-grid-preview" :class="icon.value"></span>
                    <span class="icon-grid-label">{{ icon.label }}</span>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>
            
            <el-form-item label="路由" prop="routePath">
              <el-input v-model="projectForm.menuItems[selectedItem.index].routePath" placeholder="请输入菜单项路由，例如：/***/***" />
            </el-form-item>
            
            <el-form-item label="组件路径" prop="component">
              <el-input v-model="projectForm.menuItems[selectedItem.index].component" placeholder="请输入组件路径，例如：/***/***" />
            </el-form-item>
            
            <el-form-item label="显示设置" prop="showInMenu" class="switch-form-item">
              <div class="switch-group">
                <div class="switch-item">
                  <span class="switch-label">显示在菜单</span>
                  <el-switch v-model="projectForm.menuItems[selectedItem.index].showInMenu" />
                </div>
                <div class="switch-item">
                  <span class="switch-label">显示在标签页</span>
                  <el-switch v-model="projectForm.menuItems[selectedItem.index].showInTabs" />
                </div>
              </div>
            </el-form-item>
            
            <el-form-item label="认证设置" prop="requiresAuth" class="switch-form-item">
              <div class="switch-group">
                <div class="switch-item">
                  <span class="switch-label">需要认证</span>
                  <el-switch v-model="projectForm.menuItems[selectedItem.index].requiresAuth" />
                </div>
              </div>
            </el-form-item>
            
            <el-form-item label="菜单顺序" prop="order">
              <el-input-number v-model="projectForm.menuItems[selectedItem.index].order" :min="0" :max="999" />
            </el-form-item>
          </el-form>
        </div>
        
        <!-- 底部按钮 - 固定在右下角 -->
        <div class="dialog-footer">
          <el-button @click="handleClose">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import RouteCard from './RouteCard.vue'
import AddMenuItemButton from './AddMenuItemButton.vue'
import { iconList } from '../../config/icons'
import { projectFormRules, menuItemFormRules } from '../../validators'
import { deepClone, generateDefaultMenuItem, generateDefaultProjectForm } from '../../utils'
import type { SelectedItem, ProjectFormData, CardData } from '../../types'

// 定义props
const { visible, cardData } = defineProps<{
  visible: boolean
  cardData?: CardData
}>()

// 定义事件
const emit = defineEmits<{
  save: [cardData: CardData]
  close: []
}>()

// 表单引用
const formRef = ref()
const menuFormRef = ref()

// 选中项状态
const selectedItem = reactive<SelectedItem>({
  type: 'root',
  index: null
})

// 项目表单数据
const projectForm = reactive<ProjectFormData>(generateDefaultProjectForm())

// 监听visible变化
watch(() => visible, (newVal) => {
  // 当对话框打开时，重新回显项目数据
  if (newVal && cardData) {
    // 深拷贝数据，确保不会影响原始数据
    const clonedCardData = deepClone(cardData)
    
    // 回显项目数据
    projectForm.title = clonedCardData.title || ''
    projectForm.description = clonedCardData.description || ''
    projectForm.icon = clonedCardData.icon || 'i-carbon-star'
    projectForm.routePath = clonedCardData.routePath || ''
    projectForm.redirect = clonedCardData.redirect || ''
    projectForm.showInMenu = clonedCardData.showInMenu !== undefined ? clonedCardData.showInMenu : true
    projectForm.showInTabs = clonedCardData.showInTabs !== undefined ? clonedCardData.showInTabs : true
    projectForm.requiresAuth = clonedCardData.requiresAuth !== undefined ? clonedCardData.requiresAuth : false
    projectForm.order = clonedCardData.order !== undefined ? clonedCardData.order : 999
    
    // 回显菜单项数据
    if (Array.isArray(clonedCardData.menuItems)) {
      projectForm.menuItems = clonedCardData.menuItems.map((item) => ({
        id: item.id, // 包含id字段
        title: item.title || '',
        icon: item.icon || 'i-carbon-home',
        routePath: item.routePath || '',
        component: item.component || '',
        showInMenu: item.showInMenu !== undefined ? item.showInMenu : true,
        showInTabs: item.showInTabs !== undefined ? item.showInTabs : false,
        requiresAuth: item.requiresAuth !== undefined ? item.requiresAuth : true,
        order: item.order !== undefined ? item.order : 1
      }))
    } else {
      // 如果没有菜单项，添加默认菜单项
      projectForm.menuItems = [generateDefaultMenuItem(1)]
    }
    
    // 重置选中状态
    selectedItem.type = 'root'
    selectedItem.index = null
  } else if (!newVal) {
    // 当对话框关闭时，重置表单数据
    setTimeout(() => {
      resetForm()
    }, 300)
  }
})

// 监听cardData变化，用于编辑项目时回显数据
watch(() => cardData, (newVal) => {
  if (newVal && visible) {
    // 深拷贝数据，确保不会影响原始数据
    const clonedCardData = deepClone(newVal)
    
    // 回显项目数据
    projectForm.title = clonedCardData.title || ''
    projectForm.description = clonedCardData.description || ''
    projectForm.icon = clonedCardData.icon || 'i-carbon-star'
    projectForm.routePath = clonedCardData.routePath || ''
    projectForm.redirect = clonedCardData.redirect || ''
    projectForm.showInMenu = clonedCardData.showInMenu !== undefined ? clonedCardData.showInMenu : true
    projectForm.showInTabs = clonedCardData.showInTabs !== undefined ? clonedCardData.showInTabs : true
    projectForm.requiresAuth = clonedCardData.requiresAuth !== undefined ? clonedCardData.requiresAuth : false
    projectForm.order = clonedCardData.order !== undefined ? clonedCardData.order : 999
    
    // 回显菜单项数据
    if (Array.isArray(clonedCardData.menuItems)) {
      projectForm.menuItems = clonedCardData.menuItems.map((item) => ({
        id: item.id, // 包含id字段
        title: item.title || '',
        icon: item.icon || 'i-carbon-home',
        routePath: item.routePath || '',
        component: item.component || '',
        showInMenu: item.showInMenu !== undefined ? item.showInMenu : true,
        showInTabs: item.showInTabs !== undefined ? item.showInTabs : false,
        requiresAuth: item.requiresAuth !== undefined ? item.requiresAuth : true,
        order: item.order !== undefined ? item.order : 1
      }))
    } else {
      // 如果没有菜单项，添加默认菜单项
      projectForm.menuItems = [generateDefaultMenuItem(1)]
    }
    
    // 重置选中状态
    selectedItem.type = 'root'
    selectedItem.index = null
  }
}, { deep: true })

// 选择项目
const selectItem = (type: 'root' | 'menu', index: number | null) => {
  selectedItem.type = type
  selectedItem.index = index
}

// 添加菜单项
const addMenuItem = () => {
  const newOrder = projectForm.menuItems.length + 1
  projectForm.menuItems.push(generateDefaultMenuItem(newOrder))
  
  // 自动选择新添加的菜单项
  setTimeout(() => {
    selectItem('menu', projectForm.menuItems.length - 1)
  }, 0)
}

// 删除菜单项
const removeMenuItem = (index: number) => {
  if (projectForm.menuItems.length <= 1) {
    return // 至少保留一个菜单项
  }
  projectForm.menuItems.splice(index, 1)
  
  // 如果删除的是当前选中的菜单项，重新选择第一个菜单项
  if (selectedItem.type === 'menu' && selectedItem.index === index) {
    selectItem('menu', 0)
  }
}

// 提交表单
const handleSubmit = async () => {
  if (selectedItem.type === 'root' && !formRef.value) return
  if (selectedItem.type === 'menu' && !menuFormRef.value) return
  
  try {
    if (selectedItem.type === 'root') {
      await formRef.value.validate()
    } else if (selectedItem.type === 'menu' && selectedItem.index !== null) {
      await menuFormRef.value.validate()
    }
    
    // 准备提交的数据
    const submitData: CardData = {
      title: projectForm.title,
      description: projectForm.description,
      icon: projectForm.icon,
      routePath: projectForm.routePath,
      redirect: projectForm.redirect,
      showInMenu: projectForm.showInMenu,
      showInTabs: projectForm.showInTabs,
      requiresAuth: projectForm.requiresAuth,
      order: projectForm.order,
      menuItems: projectForm.menuItems.map(item => ({
        id: item.id,
        title: item.title,
        icon: item.icon,
        routePath: item.routePath,
        component: item.component,
        showInMenu: item.showInMenu,
        showInTabs: item.showInTabs,
        requiresAuth: item.requiresAuth,
        order: item.order
      }))
    }
    
    // 触发保存事件
    emit('save', submitData)
    
    // 关闭对话框
    emit('close')
    
    // 使用 setTimeout 延迟重置表单数据，避免在关闭时看到数据重置的过程
    setTimeout(() => {
      resetForm()
    }, 300)
    
    ElMessage.success('项目添加成功')
  } catch (error) {
    console.error('表单验证失败:', error)
    ElMessage.error('表单验证失败，请检查输入')
  }
}

// 关闭对话框
const handleClose = () => {
  // 先关闭对话框，然后在对话框完全关闭后再重置表单数据
  emit('close')
  
  // 使用 setTimeout 延迟重置表单数据，避免在关闭时看到数据重置的过程
  setTimeout(() => {
    resetForm()
  }, 300)
}

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
  if (menuFormRef.value) {
    menuFormRef.value.resetFields()
  }
  
  // 重置表单数据
  Object.assign(projectForm, generateDefaultProjectForm())
  
  // 重置选中状态
  selectedItem.type = 'root'
  selectedItem.index = null
}
</script>

<style scoped>
/* 基础样式 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e6e6e6;
  flex-wrap: wrap;
}

/* 按钮组样式 - 一行显示两个按钮 */
.btn-group {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.btn-group button,
.btn-group .el-button {
  flex: 1;
  min-width: 120px;
}

/* 当只有两个按钮时，确保它们在同一行 */
@media (min-width: 480px) {
  .btn-group.two-buttons {
    display: flex;
    gap: 10px;
  }
  
  .btn-group.two-buttons button,
  .btn-group.two-buttons .el-button {
    flex: 1;
  }
}

/* 图标选择样式 */
.selected-icon {
  font-size: 16px;
  margin-right: 8px;
  font-style: normal;
}

/* 自定义弹窗样式 - 与账号设置弹窗一致 */
.add-project-overlay {
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

.add-project-dialog {
  display: flex;
  width: 900px;
  height: 650px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  animation: slideIn 0.3s ease;
  position: relative;
}

@keyframes slideIn {
  from { transform: translateY(-20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

/* 核心修复：自定义关闭按钮样式 */

/* 1. 关闭按钮容器 - 确保按钮位于正确位置 */
.dialog-close-wrapper {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 10;
}

/* 2. 关闭按钮样式 - 与账号设置弹窗完全一致 */
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

/* 3. 悬停效果 - 只改变颜色 */
.dialog-close-btn:hover {
  background-color: transparent;
  color: #666;
  box-shadow: none !important;
  transform: none;
}

/* 4. 焦点状态 - 移除所有焦点样式 */
.dialog-close-btn:focus,
.dialog-close-btn:active,
.dialog-close-btn:focus-visible {
  outline: none !important;
  box-shadow: none !important;
  background-color: transparent !important;
}

/* 5. 图标样式 */
.dialog-close-btn span {
  display: inline-block;
  padding: 4px;
  transition: color 0.2s ease;
  font-style: normal;
}

/* 左侧面板样式 */
.left-panel {
  width: 300px;
  background-color: #f5f7fa;
  border-right: 1px solid #e8e8e8;
  display: flex;
  flex-direction: column;
  padding: 20px;
  overflow-y: auto;
}

/* 右侧面板样式 - 固定按钮在底部 */
.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
  position: relative;
}

/* 面板内容区域 - 可滚动 */
.panel-content {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 80px; /* 为底部按钮留出空间 */
}

/* 面板头部样式 */
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

/* 底部按钮 - 固定在右下角 */
.dialog-footer {
  position: absolute;
  bottom: 0;
  right: 0;
  left: 0;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px;
  background-color: white;
  border-top: 1px solid #e6e6e6;
  z-index: 10;
}

/* 菜单路由区域样式 */
.menu-routes-section {
  margin-top: 20px;
}

.section-title {
  font-size: 12px;
  font-weight: 600;
  color: #999;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.menu-routes-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.no-menu-items-tip {
  text-align: center;
  padding: 20px;
  color: #999;
  background-color: #f5f7fa;
  border-radius: 8px;
  border: 1px dashed #e6e6e6;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 10px;
}

.no-menu-items-tip i {
  font-size: 18px;
}

/* 滚动条样式 - 优化为更细的圆头滚动条 */
.left-panel::-webkit-scrollbar,
.right-panel::-webkit-scrollbar {
  width: 3px;
  margin-right: 5px;
}

.left-panel::-webkit-scrollbar-track,
.right-panel::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 3px;
}

.left-panel::-webkit-scrollbar-thumb,
.right-panel::-webkit-scrollbar-thumb {
  background: rgba(168, 168, 168, 0.4);
  border-radius: 3px;
  transition: background 0.3s ease;
}

.left-panel::-webkit-scrollbar-thumb:hover,
.right-panel::-webkit-scrollbar-thumb:hover {
  background: rgba(140, 140, 140, 0.6);
}

/* 确保滚动条不影响关闭按钮 */
.right-panel {
  padding-right: 15px;
}

/* 确保表单内容能正常显示 */
:deep(.el-form) {
  overflow: visible;
}

/* 开关按钮组样式 - 一行显示两个按钮 */
.switch-group {
  display: flex;
  gap: 30px;
  align-items: center;
}

.switch-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.switch-label {
  font-size: 14px;
  color: #666;
  white-space: nowrap;
}

.switch-label.required {
  color: #606266;
}

.switch-label.required::after {
  content: '*';
  color: #f56c6c;
  margin-left: 2px;
}

/* 嵌套表单项目样式 */
.switch-form-item {
  margin-bottom: 20px;
}

.inline-switch-item {
  margin-bottom: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.inline-switch-item .el-form-item__label {
  display: none;
}

.inline-switch-item .el-form-item__content {
  margin-left: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 图标选择器样式已移至 src/styles/icon-grid.css */

.icon-grid-preview {
  font-size: 20px;
  margin-bottom: 4px;
  font-style: normal;
}

.icon-grid-label {
  font-size: 10px;
  color: #666;
  text-align: center;
}
</style>
