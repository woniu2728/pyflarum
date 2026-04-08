<template>
  <div class="discussion-list-page">
    <div class="container">
      <div class="layout">
        <!-- 侧边栏 -->
        <aside class="sidebar">
          <div class="sidebar-section">
            <h3>导航</h3>
            <nav class="nav-list">
              <a href="#" class="nav-item active">全部讨论</a>
              <a href="#" class="nav-item">关注的</a>
              <a href="#" class="nav-item">我的讨论</a>
            </nav>
          </div>

          <div class="sidebar-section">
            <h3>标签</h3>
            <div v-if="loadingTags" class="loading-small">加载中...</div>
            <div v-else class="tag-list">
              <a
                v-for="tag in tags"
                :key="tag.id"
                href="#"
                class="tag-item"
                :style="{ backgroundColor: tag.color }"
                @click.prevent="filterByTag(tag.id)"
              >
                {{ tag.name }}
              </a>
            </div>
          </div>
        </aside>

        <!-- 主内容区 -->
        <main class="main-content">
          <div class="content-header">
            <h1>讨论</h1>
            <router-link to="/discussions/create" v-if="authStore.isAuthenticated">
              <button class="primary">发起讨论</button>
            </router-link>
          </div>

          <div class="filters">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索讨论..."
              class="search-input"
              @input="handleSearch"
            />
            <select v-model="sortBy" @change="loadDiscussions" class="sort-select">
              <option value="-created_at">最新</option>
              <option value="-last_posted_at">最近回复</option>
              <option value="-comment_count">最多回复</option>
            </select>
          </div>

          <div v-if="loading" class="loading">加载中...</div>
          <div v-else-if="discussions.length === 0" class="empty">
            <p>暂无讨论</p>
            <router-link to="/discussions/create" v-if="authStore.isAuthenticated">
              <button class="primary">发起第一个讨论</button>
            </router-link>
          </div>
          <div v-else class="discussions">
            <div
              v-for="discussion in discussions"
              :key="discussion.id"
              class="discussion-item"
              :class="{
                'is-pinned': discussion.is_pinned,
                'is-locked': discussion.is_locked,
                'unread': !discussion.is_read
              }"
            >
              <!-- 用户头像 -->
              <div class="discussion-avatar">
                <div class="avatar">
                  {{ discussion.user.username.charAt(0).toUpperCase() }}
                </div>
              </div>

              <!-- 主要内容 -->
              <div class="discussion-main">
                <div class="discussion-header">
                  <!-- 标签 -->
                  <div class="discussion-tags" v-if="discussion.tags && discussion.tags.length">
                    <span
                      v-for="tag in discussion.tags"
                      :key="tag.id"
                      class="tag"
                      :style="{ backgroundColor: tag.color }"
                    >
                      {{ tag.name }}
                    </span>
                  </div>

                  <!-- 徽章 -->
                  <div class="discussion-badges">
                    <span v-if="discussion.is_pinned" class="badge badge-pinned">
                      <i class="fas fa-thumbtack"></i>
                    </span>
                    <span v-if="discussion.is_locked" class="badge badge-locked">
                      <i class="fas fa-lock"></i>
                    </span>
                  </div>
                </div>

                <!-- 标题 -->
                <router-link :to="`/discussions/${discussion.id}`" class="discussion-title">
                  {{ discussion.title }}
                </router-link>

                <!-- 元信息 -->
                <div class="discussion-info">
                  <span class="author">
                    <strong>{{ discussion.user.username }}</strong>
                  </span>
                  <span class="separator">•</span>
                  <span class="time">{{ formatDate(discussion.created_at) }}</span>
                  <span class="separator">•</span>
                  <span class="last-post" v-if="discussion.last_posted_at">
                    最后回复 {{ formatDate(discussion.last_posted_at) }}
                  </span>
                </div>
              </div>

              <!-- 统计信息 -->
              <div class="discussion-stats">
                <div class="stat-item">
                  <i class="fas fa-comment"></i>
                  <span>{{ discussion.comment_count }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 分页 -->
          <div v-if="totalPages > 1" class="pagination">
            <button
              @click="changePage(currentPage - 1)"
              :disabled="currentPage === 1"
              class="secondary"
            >
              上一页
            </button>
            <span class="page-info">第 {{ currentPage }} / {{ totalPages }} 页</span>
            <button
              @click="changePage(currentPage + 1)"
              :disabled="currentPage === totalPages"
              class="secondary"
            >
              下一页
            </button>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/api'

const authStore = useAuthStore()

const discussions = ref([])
const tags = ref([])
const loading = ref(true)
const loadingTags = ref(true)
const searchQuery = ref('')
const sortBy = ref('-created_at')
const currentPage = ref(1)
const totalPages = ref(1)
const selectedTag = ref(null)

onMounted(async () => {
  await Promise.all([loadDiscussions(), loadTags()])
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
    if (data.total) {
      totalPages.value = Math.ceil(data.total / 20)
    }
  } catch (error) {
    console.error('加载讨论失败:', error)
  } finally {
    loading.value = false
  }
}

async function loadTags() {
  loadingTags.value = true
  try {
    const data = await api.get('/tags/')
    tags.value = data.results || data
  } catch (error) {
    console.error('加载标签失败:', error)
  } finally {
    loadingTags.value = false
  }
}

function filterByTag(tagId) {
  selectedTag.value = tagId
  currentPage.value = 1
  loadDiscussions()
}

let searchTimeout
function handleSearch() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    loadDiscussions()
  }, 500)
}

function changePage(page) {
  currentPage.value = page
  loadDiscussions()
  window.scrollTo(0, 0)
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
.discussion-list-page {
  background: #f5f8fa;
  min-height: calc(100vh - 200px);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.layout {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 20px;
}

.sidebar {
  background: white;
  border-radius: 3px;
  border: 1px solid #e3e8ed;
  height: fit-content;
  position: sticky;
  top: 20px;
}

.sidebar-section {
  padding: 15px;
  border-bottom: 1px solid #e3e8ed;
}

.sidebar-section:last-child {
  border-bottom: none;
}

.sidebar-section h3 {
  font-size: 12px;
  color: #999;
  text-transform: uppercase;
  margin-bottom: 10px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.nav-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-item {
  padding: 8px 12px;
  color: #555;
  border-radius: 3px;
  transition: all 0.2s;
  font-size: 14px;
}

.nav-item:hover {
  background: #f5f8fa;
  color: #333;
  text-decoration: none;
}

.nav-item.active {
  background: #4d698e;
  color: white;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag-item {
  padding: 4px 10px;
  border-radius: 3px;
  color: white;
  font-size: 12px;
  transition: opacity 0.2s;
}

.tag-item:hover {
  opacity: 0.8;
  text-decoration: none;
}

.main-content {
  background: white;
  border-radius: 3px;
  border: 1px solid #e3e8ed;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e3e8ed;
}

.content-header h1 {
  font-size: 20px;
  color: #333;
  font-weight: 400;
}

.filters {
  display: flex;
  gap: 10px;
  padding: 15px 20px;
  border-bottom: 1px solid #e3e8ed;
  background: #fafbfc;
}

.search-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 3px;
  font-size: 13px;
}

.search-input:focus {
  outline: none;
  border-color: #4d698e;
}

.sort-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 3px;
  font-size: 13px;
  background: white;
  cursor: pointer;
}

.discussions {
  display: flex;
  flex-direction: column;
}

.discussion-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid #e3e8ed;
  transition: background 0.2s;
  position: relative;
}

.discussion-item:hover {
  background: #fafbfc;
}

.discussion-item:last-child {
  border-bottom: none;
}

.discussion-item.is-pinned {
  background: #fffbf0;
}

.discussion-item.is-pinned:hover {
  background: #fff8e1;
}

/* 头像 */
.discussion-avatar {
  flex-shrink: 0;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #4d698e;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
}

/* 主要内容 */
.discussion-main {
  flex: 1;
  min-width: 0;
}

.discussion-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.discussion-tags {
  display: flex;
  gap: 6px;
}

.tag {
  padding: 2px 8px;
  border-radius: 3px;
  color: white;
  font-size: 11px;
  font-weight: 500;
}

.discussion-badges {
  display: flex;
  gap: 5px;
}

.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 3px;
  font-size: 10px;
}

.badge-pinned {
  background: #ffc107;
  color: #856404;
}

.badge-locked {
  background: #999;
  color: white;
}

.discussion-title {
  font-size: 15px;
  font-weight: normal;
  color: #555;
  display: block;
  margin-bottom: 4px;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.discussion-item.unread .discussion-title {
  font-weight: 600;
  color: #333;
}

.discussion-title:hover {
  color: #4d698e;
  text-decoration: none;
}

.discussion-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #999;
  line-height: 1.5;
}

.discussion-info .author {
  color: #666;
}

.discussion-info .author strong {
  font-weight: 600;
}

.separator {
  color: #ddd;
}

/* 统计信息 */
.discussion-stats {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 15px;
  color: #999;
  font-size: 12px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.stat-item i {
  font-size: 14px;
}

.loading, .empty {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.loading-small {
  text-align: center;
  padding: 20px;
  color: #999;
  font-size: 12px;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  padding: 20px;
  border-top: 1px solid #e3e8ed;
}

.page-info {
  color: #999;
  font-size: 13px;
}

@media (max-width: 768px) {
  .layout {
    grid-template-columns: 1fr;
  }

  .sidebar {
    position: static;
  }

  .discussion-item {
    flex-direction: column;
    gap: 10px;
  }

  .discussion-stats {
    align-self: flex-start;
  }
}
</style>
