<template>
  <el-dialog
    v-model="dialogVisible"
    title="添加新项目卡片"
    width="500px"
    @close="handleClose"
    :close-on-click-modal="false"
    :show-close="false"
    :append-to-body="true"
    :body-style="{ overflow: 'hidden' }"
  >
    <!-- 自定义关闭按钮，直接放在对话框内容中 -->
    <div class="dialog-close-wrapper">
      <button class="dialog-close-btn" @click="handleClose" title="关闭">
        <span class="i-carbon-close"></span>
      </button>
    </div>
    
    <el-form :model="cardForm" label-width="100px" :rules="rules" ref="formRef">
      <el-form-item label="卡片标题" prop="title">
        <el-input v-model="cardForm.title" placeholder="请输入卡片标题" />
      </el-form-item>
      
      <el-form-item label="卡片描述" prop="description">
        <el-input v-model="cardForm.description" type="textarea" placeholder="请输入卡片描述" :rows="3" />
      </el-form-item>
      
      <el-form-item label="卡片图标" prop="icon">
        <el-select v-model="cardForm.icon" placeholder="请选择卡片图标" popper-class="icon-grid-select-popper">
          <template #prefix>
            <span class="selected-icon" :class="cardForm.icon"></span>
          </template>
          <el-option v-for="icon in iconList" :key="icon.value" :value="icon.value">
            <div class="icon-grid-item">
              <span class="icon-grid-preview" :class="icon.value"></span>
              <span class="icon-grid-label">{{ icon.label }}</span>
            </div>
          </el-option>
        </el-select>
      </el-form-item>
      
      <el-form-item label="卡片类型" prop="type">
        <el-select v-model="cardForm.type" placeholder="请选择卡片类型">
          <el-option label="常规项目" value="project" />
          <el-option label="其他项目" value="other" />
        </el-select>
      </el-form-item>
      
      <el-form-item label="跳转路由" prop="routePath">
        <el-input v-model="cardForm.routePath" placeholder="请输入跳转路由，例如：/blog/home" />
      </el-form-item>
      
      <!-- 菜单项创建区域 - 仅当卡片类型为常规项目时显示 -->
      <div v-if="cardForm.type === 'project'" class="menu-items-section">
        <div class="menu-section-header">
          <span class="section-title">菜单项设置</span>
          <el-button type="primary" size="small" @click="addMenuItem">
            <span class="i-carbon-add"></span> 添加菜单项
          </el-button>
        </div>
        
        <!-- 菜单项列表 -->
        <div v-if="cardForm.menuItems.length > 0" class="menu-items-list">
          <div v-for="(menuItem, index) in cardForm.menuItems" :key="index" class="menu-item-container">
            <div class="menu-item-header">
              <span class="menu-item-title">菜单项 {{ index + 1 }}</span>
              <el-button 
                type="danger" 
                size="small" 
                @click="removeMenuItem(index)"
                :disabled="cardForm.menuItems.length <= 1"
              >
                <span class="i-carbon-trash-can"></span> 删除
              </el-button>
            </div>
            
            <el-form-item 
              :prop="`menuItems.${index}.title`" 
              :rules="menuItemRules.title"
              label="标题"
              label-width="80px"
            >
              <el-input v-model="menuItem.title" placeholder="请输入菜单项标题" />
            </el-form-item>
            
            <el-form-item 
              :prop="`menuItems.${index}.icon`" 
              :rules="menuItemRules.icon"
              label="图标"
              label-width="80px"
            >
              <el-select v-model="menuItem.icon" placeholder="请选择菜单项图标" popper-class="icon-grid-select-popper">
                <template #prefix>
                  <span class="selected-icon" :class="menuItem.icon"></span>
                </template>
                <el-option v-for="icon in iconList" :key="icon.value" :value="icon.value">
                  <div class="icon-grid-item">
                    <span class="icon-grid-preview" :class="icon.value"></span>
                    <span class="icon-grid-label">{{ icon.label }}</span>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>
            
            <el-form-item 
              :prop="`menuItems.${index}.routePath`" 
              :rules="menuItemRules.routePath"
              label="路由"
              label-width="80px"
            >
              <el-input v-model="menuItem.routePath" placeholder="请输入菜单项路由，例如：/blog/home" />
            </el-form-item>
          </div>
        </div>
        
        <!-- 提示信息 - 当没有菜单项时显示 -->
        <div v-else class="no-menu-items-tip">
          <span class="i-carbon-info"></span> 点击"添加菜单项"按钮创建第一个菜单项
        </div>
      </div>
    </el-form>
    
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'

// 定义props
const props = defineProps<{
  visible: boolean
  cardData?: any
}>()

// 定义事件
const emit = defineEmits<{
  save: [cardData: any]
  close: []
}>()

// 表单引用
const formRef = ref()

// 对话框可见性
const dialogVisible = ref(props.visible)

// 监听props.visible变化
watch(() => props.visible, (newVal) => {
  dialogVisible.value = newVal
  
  // 当对话框打开时，重新回显卡片数据
  if (newVal && props.cardData) {
    // 回显卡片数据
    cardForm.title = props.cardData.title || ''
    cardForm.description = props.cardData.description || ''
    cardForm.icon = props.cardData.icon || 'i-carbon-star'
    cardForm.type = props.cardData.type || 'project'
    cardForm.routePath = props.cardData.routePath || ''
    
    // 回显菜单项数据
    if (Array.isArray(props.cardData.menuItems)) {
      cardForm.menuItems = [...props.cardData.menuItems]
    } else {
      // 如果没有菜单项，添加默认菜单项
      cardForm.menuItems = [
        {
          title: '',
          icon: 'i-carbon-home',
          routePath: ''
        }
      ]
    }
  }
})

// 监听props.cardData变化，用于编辑卡片时回显数据
watch(() => props.cardData, (newVal) => {
  if (newVal && props.visible) {
    // 回显卡片数据
    cardForm.title = newVal.title || ''
    cardForm.description = newVal.description || ''
    cardForm.icon = newVal.icon || 'i-carbon-star'
    cardForm.type = newVal.type || 'project'
    cardForm.routePath = newVal.routePath || ''
    
    // 回显菜单项数据
    if (Array.isArray(newVal.menuItems)) {
      cardForm.menuItems = [...newVal.menuItems]
    } else {
      // 如果没有菜单项，添加默认菜单项
      cardForm.menuItems = [
        {
          title: '',
          icon: 'i-carbon-home',
          routePath: ''
        }
      ]
    }
  }
}, { deep: true })

// 图标列表 - 提供常用的Carbon图标
const iconList = [
  { label: '星形', value: 'i-carbon-star' },
  { label: '主页', value: 'i-carbon-home' },
  { label: '文档', value: 'i-carbon-document' },
  { label: '编辑', value: 'i-carbon-edit' },
  { label: '文件夹', value: 'i-carbon-folder' },
  { label: '项目', value: 'i-carbon-ibm-cloud-projects' },
  { label: '代码', value: 'i-carbon-code' },
  { label: '终端', value: 'i-carbon-terminal' },
  { label: '设置', value: 'i-carbon-settings' },
  { label: '用户', value: 'i-carbon-user' },
  { label: '消息', value: 'i-carbon-chat' },
  { label: '邮件', value: 'i-carbon-email' },
  { label: '日历', value: 'i-carbon-calendar' },
  { label: '时钟', value: 'i-carbon-time' },
  { label: '搜索', value: 'i-carbon-search' },
  { label: '添加', value: 'i-carbon-add' },
  { label: '删除', value: 'i-carbon-trash-can' },
  { label: '保存', value: 'i-carbon-save' },
  { label: '导出', value: 'i-carbon-export' },
  { label: '分享', value: 'i-carbon-share' },
  { label: '下载', value: 'i-carbon-download' },
  { label: '上传', value: 'i-carbon-upload' },
  { label: '链接', value: 'i-carbon-link' },
  { label: '标签', value: 'i-carbon-tag' },
  { label: '分类', value: 'i-carbon-category' },
  { label: '分析', value: 'i-carbon-analytics' },
  { label: '云', value: 'i-carbon-cloud' }
]

// 卡片表单数据
const cardForm = reactive({
  title: '',
  description: '',
  icon: 'i-carbon-star',
  type: 'project',
  routePath: '',
  menuItems: [
    {
      title: '',
      icon: 'i-carbon-home',
      routePath: ''
    }
  ] as {
    title: string,
    icon: string,
    routePath: string
  }[]
})

// 表单验证规则
const rules = {
  title: [
    { required: true, message: '请输入卡片标题', trigger: 'blur' },
    { min: 2, max: 50, message: '标题长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入卡片描述', trigger: 'blur' },
    { min: 5, max: 200, message: '描述长度在 5 到 200 个字符', trigger: 'blur' }
  ],
  icon: [
    { required: true, message: '请选择卡片图标', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择卡片类型', trigger: 'blur' }
  ],
  routePath: [
    { required: true, message: '请输入跳转路由', trigger: 'blur' },
    { pattern: /^\/[a-zA-Z0-9\-_\/]+$/, message: '路由格式不正确，只能包含英文、数字、下划线和斜杠，应以/开头', trigger: 'blur' }
  ]
}

// 菜单项验证规则
const menuItemRules = {
  title: [
    { required: true, message: '请输入菜单项标题', trigger: 'blur' },
    { min: 2, max: 30, message: '标题长度在 2 到 30 个字符', trigger: 'blur' }
  ],
  icon: [
    { required: true, message: '请选择菜单项图标', trigger: 'blur' }
  ],
  routePath: [
    { required: true, message: '请输入菜单项路由', trigger: 'blur' },
    { pattern: /^\/[a-zA-Z0-9\-_\/]+$/, message: '路由格式不正确，只能包含英文、数字、下划线和斜杠，应以/开头', trigger: 'blur' }
  ]
}

// 添加菜单项
const addMenuItem = () => {
  cardForm.menuItems.push({
    title: '',
    icon: 'i-carbon-home',
    routePath: ''
  })
}

// 删除菜单项
const removeMenuItem = (index: number) => {
  if (cardForm.menuItems.length <= 1) {
    return // 至少保留一个菜单项
  }
  cardForm.menuItems.splice(index, 1)
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    // 准备提交的数据
    const submitData = {
      title: cardForm.title,
      description: cardForm.description,
      icon: cardForm.icon,
      type: cardForm.type,
      routePath: cardForm.routePath,
      menuItems: cardForm.menuItems.map(item => ({
        title: item.title,
        icon: item.icon,
        routePath: item.routePath
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
    
    ElMessage.success('卡片添加成功')
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
  
  // 重置表单数据
  Object.assign(cardForm, {
    title: '',
    description: '',
    icon: 'i-carbon-star',
    type: 'project',
    routePath: '',
    // 对于常规项目，默认添加一个菜单项
    menuItems: [
      {
        title: '',
        icon: 'i-carbon-home',
        routePath: ''
      }
    ]
  })
}
</script>

<style scoped>
/* 基础样式 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* 图标选择样式 */
.selected-icon {
  font-size: 16px;
  margin-right: 8px;
  font-style: normal;
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

/* 6. 确保对话框标题栏样式正确 */
:deep(.el-dialog__header) {
  padding-right: 40px;
}

/* 7. 确保对话框本身没有边框和阴影 */
:deep(.el-dialog) {
  box-shadow: none;
  border: none;
  max-height: 90vh; /* 限制弹窗最大高度为视口高度的90% */
  overflow: hidden !important; /* 隐藏弹窗本身的滚动条 */
  /* 彻底隐藏滚动条 */
  -ms-overflow-style: none; /* IE和Edge */
  scrollbar-width: none; /* Firefox */
  &::-webkit-scrollbar {
    display: none; /* Chrome, Safari和Opera */
  }
}

/* 确保对话框内容区域不出现滚动条 */
:deep(.el-dialog__body) {
  overflow: hidden !important; /* 隐藏内容区域的滚动条 */
  padding-right: 20px; /* 添加右侧内边距，避免内容被遮挡 */
  /* 彻底隐藏滚动条 */
  -ms-overflow-style: none;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
}

/* 确保表单内容能正常显示 */
:deep(.el-form) {
  overflow: visible;
}

/* 确保整个对话框容器都不显示滚动条 */
:deep(.el-dialog__wrapper) {
  overflow: hidden !important;
  /* 彻底隐藏滚动条 */
  -ms-overflow-style: none;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
}

/* 菜单项样式 */
.menu-items-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e6e6e6;
  position: relative;
  /* 添加内边距以确保内容不被遮挡 */
  padding-right: 10px;
}

.menu-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.menu-items-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
  /* 固定高度为一个完整菜单项的高度 */
  height: 230px;
  overflow-y: auto;
  /* 添加内边距，避免滚动条与内容重叠 */
  padding-right: 8px;
  /* 自定义滚动条样式 */
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }
}

.menu-item-container {
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 8px;
  border: 1px solid #e6e6e6;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #409eff;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  }
}

.menu-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.menu-item-title {
  font-size: 14px;
  font-weight: bold;
  color: #666;
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
}

.no-menu-items-tip i {
  font-size: 18px;
}
</style>