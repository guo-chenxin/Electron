<template>
  <div class="favorite-projects">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <el-skeleton :rows="5" animated />
    </div>
    
    <!-- 收藏项目列表 -->
    <div v-else-if="favoriteProjects.length > 0" class="card-grid">
      <div 
        v-for="project in favoriteProjects" 
        :key="project.id"
        class="card-container"
        @contextmenu.prevent="showContextMenu($event, project)"
      >
        <ProjectCard 
          :title="project.title"
          :description="project.description"
          :icon="project.icon"
          :is-favorite="project.isFavorite"
          @click="handleProjectClick(project)"
        />
      </div>
    </div>
    
    <!-- 空状态组件 -->
    <EmptyState 
      v-else
      title="暂无收藏项目"
      description="您还没有收藏任何项目，去浏览项目并收藏吧！"
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
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import ProjectCard from '../../components/main-window/ProjectCard.vue'
import EmptyState from '../../components/main-window/EmptyState.vue'

// 添加electron的类型声明
declare global {
  interface Window {
    electronAPI: {
      invoke: <T = any>(channel: string, ...args: any[]) => Promise<T>
    }
  }
}

const router = useRouter()

// 卡片数据类型
interface Card {
  id: number
  title: string
  description: string
  icon: string
  isFavorite: boolean
  type: string
  routePath: string
  lastClickedAt: string
  createdAt: string
  updatedAt: string
}

// 收藏卡片数据
const favoriteProjects = ref<Card[]>([])
const loading = ref(false)

// 右键菜单相关状态
const contextMenuVisible = ref(false)
const contextMenuPosition = ref({ x: 0, y: 0 })
const selectedCard = ref<Card | null>(null)

// 加载收藏卡片数据
const loadFavoriteProjects = async () => {
  loading.value = true
  try {
    // 从数据库加载收藏卡片数据
    const loadedCards = await window.electronAPI.invoke<Card[]>('api:cards:getFavorites')
    if (loadedCards && loadedCards.length > 0) {
      favoriteProjects.value = loadedCards
    } else {
      favoriteProjects.value = []
    }
  } catch (error: any) {
    console.error('Failed to load favorite cards:', error)
    favoriteProjects.value = []
  } finally {
    loading.value = false
  }
}

// 组件挂载时加载数据
onMounted(() => {
  loadFavoriteProjects()
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

// 处理项目点击
const handleProjectClick = (project: Card) => {
  // 更新卡片的最近访问时间
  window.electronAPI.invoke('api:cards:click', project.id).catch((error: any) => {
    console.error('Failed to update card click time:', error)
  })
  
  // 跳转到对应的路由
  router.push(project.routePath)
}

// 处理编辑卡片点击
const handleEditCardClick = () => {
  if (selectedCard.value) {
    // 这里可以添加编辑卡片的逻辑，比如打开编辑对话框
    ElMessage.info('编辑卡片功能正在开发中')
    contextMenuVisible.value = false
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
    favoriteProjects.value = favoriteProjects.value.filter(card => card.id !== selectedCard.value!.id)
    
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
      const index = favoriteProjects.value.findIndex(card => card.id === selectedCard.value!.id)
      if (index !== -1) {
        favoriteProjects.value[index] = updatedCard
      }
      
      // 如果卡片被取消收藏，从收藏列表中移除
      if (!updatedCard.isFavorite) {
        favoriteProjects.value = favoriteProjects.value.filter(card => card.id !== selectedCard.value!.id)
      }
      
      ElMessage.success(updatedCard.isFavorite ? '添加收藏成功' : '移除收藏成功')
    }
  } catch (error: any) {
    console.error('Failed to update favorite status:', error)
    
    // 即使API调用失败，也更新本地状态以提供更好的用户体验
    if (selectedCard.value) {
      const updatedIsFavorite = !selectedCard.value.isFavorite
      const index = favoriteProjects.value.findIndex(card => card.id === selectedCard.value!.id)
      if (index !== -1) {
        favoriteProjects.value[index].isFavorite = updatedIsFavorite
        
        // 如果卡片被取消收藏，从收藏列表中移除
        if (!updatedIsFavorite) {
          favoriteProjects.value = favoriteProjects.value.filter(card => card.id !== selectedCard.value!.id)
        }
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
/* 收藏项目样式 */
.favorite-projects {
  width: 100%;
  height: 100%;
  overflow-y: auto;
}

/* 加载状态 */
.loading-state {
  padding: 20px;
}

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