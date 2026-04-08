<template>
  <div class="index-page">
    <div class="container">
      <!-- 左侧导航栏 -->
      <aside class="index-nav">
        <nav class="index-nav-list">
          <ul>
            <li>
              <router-link to="/" class="nav-item" :class="{ active: activeNav === 'all' }">
                <i class="fas fa-comments"></i>
                <span>全部讨论</span>
              </router-link>
            </li>
            <li v-if="authStore.isAuthenticated">
              <a href="#" class="nav-item" @click.prevent="activeNav = 'following'">
                <i class="fas fa-star"></i>
                <span>关注的</span>
              </a>
            </li>
            <li v-if="authStore.isAuthenticated">
              <router-link to="/profile" class="nav-item">
                <i class="fas fa-user"></i>
                <span>我的讨论</span>
              </router-link>
            </li>
          </ul>
        </nav>

        <div class="index-nav-section">
          <h4 class="index-nav-heading">标签</h4>
          <nav class="index-nav-list">
            <ul>
              <li v-for="tag in tags" :key="tag.id">
                <a
                  href="#"
                  class="nav-item tag-item"
                  @click.prevent="filterByTag(tag.id)"
                  :class="{ active: selectedTag === tag.id }"
                >
                  <span class="tag-bullet" :style="{ backgroundColor: tag.color }"></span>
                  <span>{{ tag.name }}</span>
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </aside>

      <!-- 主内容区 -->
      <main class="index-content">
        <!-- 顶部工具栏 -->
        <header class="index-toolbar">
          <ul class="index-toolbar-view">
            <li>
              <button class="btn-link" :class="{ active: sortBy === '-created_at' }" @click="changeSortBy('-created_at')">
                最新
              </button>
            </li>
            <li>
              <button class="btn-link" :class="{ active: sortBy === '-last_posted_at' }" @click="changeSortBy('-last_posted_at')">
                最近回复
              </button>
            </li>
            <li>
              <button class="btn-link" :class="{ active: sortBy === '-comment_count' }" @click="changeSortBy('-comment_count')">
                热门
              </button>
            </li>
          </ul>

          <ul class="index-toolbar-action">
            <li v-if="authStore.isAuthenticated">
              <button class="btn btn-primary" @click="$router.push('/discussions/create')">
                <i class="fas fa-edit"></i>
                发起讨论
              </button>
            </li>
            <li v-else>
              <button class="btn btn-primary" @click="$router.push('/login')">
                <i class="fas fa-edit"></i>
                发起讨论
              </button>
            </li>
          </ul>
        </header>

        <!-- 讨论列表 -->
        <div v-if="loading" class="loading-container">
          <div class="spinner"></div>
        </div>

        <div v-else-if="discussions.length === 0" class="empty-state">
          <p>暂无讨论</p>
        </div>

        <div v-else class="discussion-list">
          <div
            v-for="discussion in discussions"
            :key="discussion.id"
            class="discussion-list-item"
            :class="{ 'is-pinned': discussion.is_pinned }"
          >
            <!-- 用户头像 -->
            <div class="discussion-avatar">
              <div class="avatar" :style="{ backgroundColor: getUserColor(discussion.user) }">
                {{ discussion.user.username.charAt(0).toUpperCase() }}
              </div>
            </div>

            <!-- 讨论主体 -->
            <div class="discussion-main">
              <!-- 徽章 -->
              <div class="discussion-badges">
                <span v-if="discussion.is_pinned" class="badge badge-pinned">
                  <i class="fas fa-thumbtack"></i>
                </span>
                <span v-if="discussion.is_locked" class="badge badge-locked">
                  <i class="fas fa-lock"></i>
                </span>
              </div>

              <!-- 标题 -->
              <router-link :to="`/d/${discussion.id}`" class="discussion-title">
                {{ discussion.title }}
              </router-link>

              <!-- 标签 -->
              <div class="discussion-tags" v-if="discussion.tags && discussion.tags.length">
                <span
                  v-for="tag in discussion.tags"
                  :key="tag.id"
                  class="tag-label"
                  :style="{ backgroundColor: tag.color }"
                >
                  {{ tag.name }}
                </span>
              </div>

              <!-- 元信息 -->
              <div class="discussion-info">
                <span class="discussion-author">
                  {{ discussion.user.username }}
                </span>
                <span class="discussion-time">发起于 {{ formatDate(discussion.created_at) }}</span>
                <span v-if="discussion.last_posted_at" class="discussion-last-post">
                  <span class="bullet">•</span>
                  最后回复 {{ formatDate(discussion.last_posted_at) }}
                </span>
              </div>
            </div>

            <!-- 统计信息 -->
            <div class="discussion-stats">
              <span class="discussion-replies">
                <i class="fas fa-comment"></i>
                {{ discussion.comment_count }}
              </span>
            </div>
          </div>
        </div>

        <!-- 加载更多 -->
        <div v-if="hasMore" class="load-more">
          <button class="btn btn-default" @click="loadMore" :disabled="loadingMore">
            {{ loadingMore ? '加载中...' : '加载更多' }}
          </button>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRoute } from 'vue-router'
import api from '@/api'

const authStore = useAuthStore()
const route = useRoute()

const discussions = ref([])
const tags = ref([])
const loading = ref(true)
const loadingMore = ref(false)
const searchQuery = ref('')
const sortBy = ref('-created_at')
const currentPage = ref(1)
const hasMore = ref(false)
const selectedTag = ref(null)
const activeNav = ref('all')

onMounted(async () => {
  // 从 URL 获取搜索参数
  if (route.query.search) {
    searchQuery.value = route.query.search
  }
  await Promise.all([loadDiscussions(), loadTags()])
})

// 监听路由变化
watch(() => route.query.search, (newSearch) => {
  searchQuery.value = newSearch || ''
  currentPage.value = 1
  loadDiscussions()
})

async function loadDiscussions() {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      ordering: sortBy.value
    }
    if (searchQuery.value) {
      params.search = searchQuery.value
    }
    if (selectedTag.value) {
      params.tag = selectedTag.value
    }

    const data = await api.get('/discussions/', { params })
    discussions.value = data.data || data.results || data
    hasMore.value = data.page * data.limit < data.total
  } catch (error) {
    console.error('加载讨论失败:', error)
  } finally {
    loading.value = false
  }
}

async function loadTags() {
  try {
    const data = await api.get('/tags')
    tags.value = data.results || data
  } catch (error) {
    console.error('加载标签失败:', error)
  }
}

function filterByTag(tagId) {
  selectedTag.value = selectedTag.value === tagId ? null : tagId
  currentPage.value = 1
  loadDiscussions()
}

function changeSortBy(sort) {
  sortBy.value = sort
  currentPage.value = 1
  loadDiscussions()
}

async function loadMore() {
  loadingMore.value = true
  currentPage.value++
  try {
    const params = {
      page: currentPage.value,
      ordering: sortBy.value
    }
    if (selectedTag.value) {
      params.tag = selectedTag.value
    }

    const data = await api.get('/discussions/', { params })
    discussions.value.push(...(data.data || data.results || data))
    hasMore.value = data.page * data.limit < data.total
  } catch (error) {
    console.error('加载更多失败:', error)
  } finally {
    loadingMore.value = false
  }
}

function getUserColor(user) {
  const colors = ['#4D698E', '#E74C3C', '#3498DB', '#2ECC71', '#F39C12', '#9B59B6']
  const index = user.id % colors.length
  return colors[index]
}

function formatDate(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 30) return `${days}天前`
  return date.toLocaleDateString('zh-CN')
}
</script>

<style scoped>
.index-page {
  background: #f5f8fa;
  min-height: calc(100vh - 56px);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0;
  display: flex;
  gap: 0;
}

/* 左侧导航 */
.index-nav {
  width: 240px;
  background: white;
  border-right: 1px solid #e3e8ed;
  min-height: calc(100vh - 56px);
  position: sticky;
  top: 56px;
}

.index-nav-list ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  color: #555;
  text-decoration: none;
  transition: all 0.15s;
  font-size: 14px;
  cursor: pointer;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
}

.nav-item:hover {
  background: #f5f8fa;
  color: #333;
}

.nav-item.active {
  background: #4D698E;
  color: white;
}

.nav-item i {
  width: 18px;
  text-align: center;
  font-size: 14px;
}

.index-nav-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e3e8ed;
}

.index-nav-heading {
  padding: 8px 20px;
  font-size: 12px;
  color: #999;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.5px;
  margin: 0;
}

.tag-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.tag-bullet {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* 主内容区 */
.index-content {
  flex: 1;
  background: white;
}

.index-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #e3e8ed;
  background: #fafbfc;
}

.index-toolbar-view {
  display: flex;
  gap: 20px;
  list-style: none;
  padding: 0;
  margin: 0;
}

.index-toolbar-action {
  display: flex;
  gap: 10px;
  list-style: none;
  padding: 0;
  margin: 0;
}

.btn-link {
  background: none;
  border: none;
  color: #666;
  font-size: 14px;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 3px;
  transition: all 0.15s;
}

.btn-link:hover {
  background: #e3e8ed;
  color: #333;
}

.btn-link.active {
  background: #4D698E;
  color: white;
}

.btn {
  padding: 8px 16px;
  border-radius: 3px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-primary {
  background: #E7672E;
  color: white;
}

.btn-primary:hover {
  background: #D85B1E;
}

.btn-default {
  background: #e3e8ed;
  color: #555;
}

.btn-default:hover {
  background: #d3d8dd;
}

/* 讨论列表 */
.discussion-list {
  display: flex;
  flex-direction: column;
}

.discussion-list-item {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  padding: 18px 20px;
  border-bottom: 1px solid #e3e8ed;
  transition: background 0.15s;
  cursor: pointer;
}

.discussion-list-item:hover {
  background: #fafbfc;
}

.discussion-list-item.is-pinned {
  background: #fffbf0;
}

.discussion-list-item.is-pinned:hover {
  background: #fff8e1;
}

.discussion-avatar {
  flex-shrink: 0;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 16px;
  font-weight: 600;
}

.discussion-main {
  flex: 1;
  min-width: 0;
}

.discussion-badges {
  display: flex;
  gap: 6px;
  margin-bottom: 4px;
}

.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 3px;
  font-size: 11px;
}

.badge-pinned {
  background: #FFC107;
  color: #856404;
}

.badge-locked {
  background: #999;
  color: white;
}

.discussion-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  display: block;
  margin-bottom: 6px;
  line-height: 1.4;
  text-decoration: none;
}

.discussion-title:hover {
  color: #4D698E;
}

.discussion-tags {
  display: flex;
  gap: 6px;
  margin-bottom: 6px;
}

.tag-label {
  padding: 3px 10px;
  border-radius: 3px;
  color: white;
  font-size: 12px;
  font-weight: 500;
}

.discussion-info {
  font-size: 13px;
  color: #999;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.discussion-author {
  color: #666;
  font-weight: 500;
}

.bullet {
  color: #ddd;
}

.discussion-stats {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  color: #999;
  font-size: 14px;
  padding-top: 8px;
}

.discussion-replies {
  display: flex;
  align-items: center;
  gap: 6px;
}

.loading-container {
  display: flex;
  justify-content: center;
  padding: 60px 20px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e3e8ed;
  border-top-color: #4D698E;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
  color: #999;
  font-size: 15px;
}

.load-more {
  text-align: center;
  padding: 20px;
  border-top: 1px solid #e3e8ed;
}

@media (max-width: 768px) {
  .container {
    flex-direction: column;
  }

  .index-nav {
    width: 100%;
    position: static;
    min-height: auto;
  }
}
</style>
