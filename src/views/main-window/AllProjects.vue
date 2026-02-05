<template>
  <div class="all-projects">
    <div class="card-grid">
      <!-- 项目卡片列表 -->
      <div 
        v-for="card in cards" 
        :key="card.id"
        class="card-container"
        @contextmenu.prevent="showContextMenu($event, card)"
      >
        <ProjectCard 
          :title="card.title"
          :description="card.description"
          :icon="card.icon"
          :is-favorite="card.isFavorite"
          @click="navigateToCard(card)"
        />
      </div>
      
      <!-- 添加卡片按钮 -->
      <div class="add-card" @click="showAddDialog = true">
        <div class="add-card-content">
          <span class="add-card-icon i-carbon-add">+</span>
          <span class="add-card-text">新建项目</span>
        </div>
      </div>
    </div>
    
    <!-- 添加卡片对话框 -->
    <AddCardDialog 
      :visible="showAddDialog" 
      @save="handleSaveCard" 
      @close="showAddDialog = false" 
    />
    
    <!-- 编辑卡片对话框 -->
    <AddCardDialog 
      :visible="showEditDialog" 
      :card-data="selectedCardData" 
      @save="handleEditCard" 
      @close="showEditDialog = false" 
    />
    
    <!-- 右键菜单 -->
    <div 
      v-if="contextMenuVisible" 
      class="context-menu"
      :style="{ left: contextMenuPosition.x + 'px', top: contextMenuPosition.y + 'px' }"
      @click.stop
    >
      <el-menu default-active="1" class="context-menu-items">
        <el-menu-item @click="handleEditCardClick">
          <span>编辑卡片</span>
        </el-menu-item>
        <el-menu-item @click="handleDeleteCardClick">
          <span>删除卡片</span>
        </el-menu-item>
        <el-menu-item @click="handleToggleFavoriteClick">
          <span>{{ selectedCard?.isFavorite ? '移除收藏' : '添加收藏' }}</span>
        </el-menu-item>
      </el-menu>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import ProjectCard from '../../components/main-window/ProjectCard.vue'
import AddCardDialog from '../../components/main-window/AddCardDialog.vue'
import { loadDynamicRoutes } from '../../router'
import { fetchRoutesForTabs } from '../../composables/useTabs'

// 添加electron的类型声明
declare global {
  interface Window {
    electronAPI: {
      invoke: <T = any>(channel: string, ...args: any[]) => Promise<T>
    }
  }
}

const router = useRouter()
const showAddDialog = ref(false)
const showEditDialog = ref(false)

// 卡片数据类型
interface Card {
  id: number
  title: string
  description: string
  icon: string
  isFavorite: boolean
  type?: string
  routePath: string
  redirect?: string
  showInMenu?: boolean
  showInTabs?: boolean
  requiresAuth?: boolean
  order?: number
  menuItems?: Array<{
    title: string
    icon: string
    routePath: string
    component?: string
    requiresAuth?: boolean
    showInMenu?: boolean
    showInTabs?: boolean
    order?: number
  }>
  lastClickedAt: string
  createdAt: string
  updatedAt: string
}

// 卡片数据 - 初始为空数组，不显示默认卡片
const cards = ref<Card[]>([])

// 右键菜单相关状态
const contextMenuVisible = ref(false)
const contextMenuPosition = ref({ x: 0, y: 0 })
const selectedCard = ref<Card | null>(null)

// 计算属性：将selectedCard转换为CardData类型
const selectedCardData = computed(() => {
  if (!selectedCard.value) return undefined
  
  return {
    id: selectedCard.value.id,
    title: selectedCard.value.title,
    description: selectedCard.value.description,
    icon: selectedCard.value.icon,
    routePath: selectedCard.value.routePath,
    redirect: selectedCard.value.redirect || '',
    showInMenu: selectedCard.value.showInMenu !== undefined ? selectedCard.value.showInMenu : true,
    showInTabs: selectedCard.value.showInTabs !== undefined ? selectedCard.value.showInTabs : true,
    requiresAuth: selectedCard.value.requiresAuth !== undefined ? selectedCard.value.requiresAuth : false,
    order: selectedCard.value.order !== undefined ? selectedCard.value.order : 999,
    menuItems: selectedCard.value.menuItems || []
  }
})

// 加载卡片数据
const loadCards = async () => {
  try {
    // 从数据库加载卡片数据
    const loadedCards = await window.electronAPI.invoke<Card[]>('api:cards:getAll')
    if (loadedCards && loadedCards.length > 0) {
      cards.value = loadedCards
    }
  } catch (error: any) {
    console.error('Failed to load cards:', error)
    // 不使用默认卡片，保持数组为空
    cards.value = []
  }
}

// 组件挂载时加载卡片数据
onMounted(() => {
  loadCards()
  // 添加点击空白处关闭右键菜单的事件
  document.addEventListener('click', handleClickOutside)
  // 添加全局右键菜单事件，防止默认右键菜单
  document.addEventListener('contextmenu', handleGlobalContextMenu)
})

// 组件卸载时移除事件监听器
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('contextmenu', handleGlobalContextMenu)
})

// 处理点击空白处关闭右键菜单
const handleClickOutside = () => {
  contextMenuVisible.value = false
}

// 处理全局右键菜单事件
const handleGlobalContextMenu = (event: MouseEvent) => {
  // 只有当右键菜单可见时才阻止默认行为
  if (contextMenuVisible.value) {
    event.preventDefault()
  }
}

// 显示右键菜单
const showContextMenu = (event: MouseEvent, card: Card) => {
  event.preventDefault()
  contextMenuPosition.value = {
    x: event.clientX,
    y: event.clientY
  }
  selectedCard.value = card
  contextMenuVisible.value = true
}

// 导航到卡片对应的路由
const navigateToCard = (card: Card) => {
  // 更新卡片的最近访问时间
  window.electronAPI.invoke('api:cards:click', card.id).catch((error: any) => {
    console.error('Failed to update card click time:', error)
  })
  
  // 跳转到对应的路由
  router.push(card.routePath)
}

// 处理保存卡片
const handleSaveCard = async (cardData: any) => {
  try {
    // 调用API保存卡片
    const newCard = await window.electronAPI.invoke<Card>('api:cards:create', cardData)
    
    if (newCard) {
      // 将新卡片添加到列表
      cards.value.push(newCard)
      
      // 重新加载动态路由，确保新创建的路由被添加到前端路由配置中
      await loadDynamicRoutes()
      
      // 重新加载标签页配置，确保新创建的路由被添加到标签页配置中
      await fetchRoutesForTabs()
      
      console.log('Dynamic routes and tab config reloaded after card creation')
    }
  } catch (error: any) {
    console.error('Failed to save card:', error)
    // 如果API调用失败，使用本地数据模拟
    const newCard: Card = {
      id: Date.now() as unknown as number,
      title: cardData.title,
      description: cardData.description,
      icon: cardData.icon,
      isFavorite: false,
      type: cardData.type || 'project',
      routePath: cardData.routePath,
      lastClickedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    cards.value.push(newCard)
  }
}

// 处理编辑卡片点击
const handleEditCardClick = () => {
  if (selectedCard.value) {
    showEditDialog.value = true
    contextMenuVisible.value = false
  }
}

// 处理编辑卡片保存
const handleEditCard = async (cardData: any) => {
  if (!selectedCard.value) return
  
  try {
    // 调用API更新卡片
    const updatedCard = await window.electronAPI.invoke<Card>('api:cards:update', selectedCard.value.id, cardData)
    
    if (updatedCard) {
      // 更新本地卡片数据
      const index = cards.value.findIndex(card => card.id === selectedCard.value!.id)
      if (index !== -1) {
        cards.value[index] = updatedCard
      }
      
      // 重新加载动态路由，确保更新后的路由被添加到前端路由配置中
      await loadDynamicRoutes()
      
      // 重新加载标签页配置，确保更新后的路由被添加到标签页配置中
      await fetchRoutesForTabs()
      
      ElMessage.success('卡片编辑成功')
    }
  } catch (error: any) {
    console.error('Failed to update card:', error)
    
    // 即使API调用失败，也更新本地状态以提供更好的用户体验
    const index = cards.value.findIndex(card => card.id === selectedCard.value!.id)
    if (index !== -1) {
      cards.value[index] = {
        ...cards.value[index],
        ...cardData
      }
    }
    
    ElMessage.success('卡片编辑成功')
  }
}

// 处理删除卡片点击
const handleDeleteCardClick = async () => {
  if (!selectedCard.value) return
  
  try {
    // 显示确认对话框
    await ElMessageBox.confirm(
      '确定要删除这个卡片吗？',
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 调用API删除卡片
    await window.electronAPI.invoke('api:cards:delete', selectedCard.value.id)
    
    // 从本地卡片数据中移除
    cards.value = cards.value.filter(card => card.id !== selectedCard.value!.id)
    
    // 重新加载动态路由，确保删除后的路由配置被更新
    await loadDynamicRoutes()
    
    // 重新加载标签页配置，确保删除后的路由配置被更新
    await fetchRoutesForTabs()
    
    ElMessage.success('卡片删除成功')
    contextMenuVisible.value = false
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('Failed to delete card:', error)
      ElMessage.error('卡片删除失败')
    }
  }
}

// 处理添加/移除收藏点击
const handleToggleFavoriteClick = async () => {
  if (!selectedCard.value) return
  
  try {
    // 调用API更新收藏状态
    const updatedCard = await window.electronAPI.invoke<Card>('api:cards:update', selectedCard.value.id, {
      isFavorite: !selectedCard.value.isFavorite
    })
    
    if (updatedCard) {
      // 更新本地卡片数据
      const index = cards.value.findIndex(card => card.id === selectedCard.value!.id)
      if (index !== -1) {
        cards.value[index] = updatedCard
      }
      
      ElMessage.success(updatedCard.isFavorite ? '添加收藏成功' : '移除收藏成功')
    }
  } catch (error: any) {
    console.error('Failed to update favorite status:', error)
    
    // 即使API调用失败，也更新本地状态以提供更好的用户体验
    if (selectedCard.value) {
      const updatedIsFavorite = !selectedCard.value.isFavorite
      const index = cards.value.findIndex(card => card.id === selectedCard.value!.id)
      if (index !== -1) {
        cards.value[index].isFavorite = updatedIsFavorite
      }
      ElMessage.success(updatedIsFavorite ? '添加收藏成功' : '移除收藏成功')
    } else {
      ElMessage.error('更新收藏状态失败')
    }
  }
  
  contextMenuVisible.value = false
}
</script>

<style scoped>
/* 卡片网格样式 - 左对齐 */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, 200px);
  gap: 20px;
  justify-content: start;
  max-width: 100%;
  width: 100%;
}

/* 卡片容器样式 */
.card-container {
  position: relative;
}

/* 添加卡片按钮样式 */
.add-card {
  width: 200px;
  min-height: 220px;
  border: 2px dashed #d9d9d9;
  border-radius: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: #ffffff;
}

.add-card:hover {
  border-color: #409eff;
  background-color: #ecf5ff;
  transform: translateY(-5px);
}

.add-card-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.add-card-icon {
  font-size: 40px;
  color: #409eff;
  margin-bottom: 15px;
  font-style: normal;
}

.add-card-text {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

/* 右键菜单样式 */
.context-menu {
  position: fixed;
  z-index: 10000;
  background: #ffffff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 4px 0;
  min-width: 160px;
}

.context-menu-items {
  border: none;
  box-shadow: none;
}

.context-menu-items .el-menu-item {
  height: 36px;
  line-height: 36px;
  padding: 0 16px;
  margin: 0;
  font-size: 14px;
}

.context-menu-items .el-menu-item:hover {
  background-color: #ecf5ff;
}

.context-menu-items .el-menu-item.is-active {
  background-color: #ecf5ff;
  color: #409eff;
}
</style>