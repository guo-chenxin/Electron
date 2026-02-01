<template>
  <div class="recent-projects">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <el-skeleton :rows="5" animated />
    </div>
    
    <!-- 最近项目列表 -->
    <div v-else-if="recentProjects.length > 0" class="card-grid">
      <el-card 
        v-for="project in recentProjects" 
        :key="project.id"
        class="project-card"
        shadow="hover"
        @click="handleProjectClick(project)"
      >
        <div class="card-content">
            <span class="card-icon" :class="project.icon || 'i-carbon-folder'"></span>
            <h2 class="card-title">{{ project.title }}</h2>
            <p class="card-meta">
              最近访问: {{ formatLastClicked(project.lastClickedAt) }}
            </p>
          </div>
      </el-card>
    </div>
    
    <!-- 空状态组件 -->
    <EmptyState 
      v-else
      icon="i-carbon-clock"
      title="暂无最近访问"
      description="您还没有访问过任何项目，去浏览项目吧！"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import EmptyState from '../../components/main-window/EmptyState.vue'

const router = useRouter()
const recentProjects = ref<any[]>([])
const loading = ref(false)

// 格式化最后点击时间
const formatLastClicked = (lastClickedAt: string) => {
  const date = new Date(lastClickedAt)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) {
    return '今天'
  } else if (diffDays === 1) {
    return '昨天'
  } else if (diffDays === 2) {
    return '前天'
  } else {
    return `${diffDays}天前`
  }
}

// 处理项目点击
const handleProjectClick = (project: any) => {
  if (project.routePath) {
    router.push(project.routePath)
  }
}

// 获取最近项目
const fetchRecentProjects = async () => {
  loading.value = true
  try {
    // 从主进程获取所有卡片
    const cards = await window.electronAPI.invoke<any[]>('api:cards:getAll')
    
    // 计算三天前的时间
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
    
    // 过滤最近三天内点击过的卡片
    recentProjects.value = cards.filter(card => {
      if (!card.lastClickedAt) return false
      const lastClicked = new Date(card.lastClickedAt)
      return lastClicked >= threeDaysAgo
    })
    
    // 按最后点击时间排序，最近的在前
    recentProjects.value.sort((a, b) => {
      const dateA = new Date(a.lastClickedAt)
      const dateB = new Date(b.lastClickedAt)
      return dateB.getTime() - dateA.getTime()
    })
  } catch (error) {
    console.error('Failed to fetch recent projects:', error)
    recentProjects.value = []
  } finally {
    loading.value = false
  }
}

// 组件挂载时获取数据
onMounted(() => {
  fetchRecentProjects()
})
</script>

<style scoped>
/* 最近项目样式 */
.recent-projects {
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

/* 项目卡片样式 */
.project-card {
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border-radius: 10px;
  height: 100%;
  min-height: 200px;
}

/* 卡片悬停效果 */
.project-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

/* 卡片内容样式 */
.card-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 25px 20px;
  text-align: center;
  height: 100%;
}

/* 项目图标样式 */
.card-icon {
  font-size: 40px;
  color: #409eff;
  margin-bottom: 15px;
}

/* 项目标题样式 */
.card-title {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 8px;
  word-break: break-word;
}

/* 项目元信息样式 */
.card-meta {
  font-size: 12px;
  color: #909399;
  margin-top: 12px;
  text-align: center;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .card-grid {
    grid-template-columns: 1fr;
  }
}
</style>