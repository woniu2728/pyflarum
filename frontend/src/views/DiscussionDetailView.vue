<template>
  <div class="discussion-detail-page">
    <div class="container">
      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="!discussion" class="error">讨论不存在</div>
      <div v-else class="layout">
        <!-- 主内容区 -->
        <main class="main-content">
          <!-- 讨论标题 -->
          <div class="discussion-header">
            <div class="discussion-badges">
              <span v-if="discussion.is_pinned" class="badge badge-pinned">置顶</span>
              <span v-if="discussion.is_locked" class="badge badge-locked">锁定</span>
              <span v-if="discussion.is_hidden" class="badge badge-hidden">隐藏</span>
            </div>
            <h1>{{ discussion.title }}</h1>
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
          </div>

          <!-- 帖子列表 -->
          <div class="posts">
            <div
              v-for="post in posts"
              :key="post.id"
              class="post-item"
              :class="{ 'is-hidden': post.is_hidden }"
            >
              <div class="post-avatar">
                <div v-if="!post.user.avatar_url" class="avatar-placeholder">
                  {{ post.user.username.charAt(0).toUpperCase() }}
                </div>
                <img
                  v-else
                  :src="post.user.avatar_url"
                  :alt="post.user.username"
                />
              </div>

              <div class="post-content">
                <div class="post-header">
                  <span class="post-author">{{ post.user.username }}</span>
                  <span class="post-number">#{{ post.number }}</span>
                  <span class="post-time">{{ formatDate(post.created_at) }}</span>
                  <span v-if="post.edited_at" class="post-edited">(已编辑)</span>
                </div>

                <div class="post-body" v-html="post.content_html"></div>

                <div class="post-footer">
                  <button
                    @click="toggleLike(post)"
                    class="post-action"
                    :class="{ 'is-liked': post.is_liked }"
                  >
                    ❤️ {{ post.likes_count || 0 }}
                  </button>
                  <button
                    @click="replyToPost(post)"
                    class="post-action"
                    v-if="authStore.isAuthenticated && !discussion.is_locked"
                  >
                    💬 回复
                  </button>
                  <button
                    @click="editPost(post)"
                    class="post-action"
                    v-if="canEditPost(post)"
                  >
                    ✏️ 编辑
                  </button>
                  <button
                    @click="deletePost(post)"
                    class="post-action danger"
                    v-if="canDeletePost(post)"
                  >
                    🗑️ 删除
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 加载更多 -->
          <div v-if="hasMore" class="load-more">
            <button @click="loadMorePosts" class="secondary" :disabled="loadingMore">
              {{ loadingMore ? '加载中...' : '加载更多' }}
            </button>
          </div>

          <!-- 回复框 -->
          <div v-if="authStore.isAuthenticated && !discussion.is_locked" class="reply-box">
            <h3>{{ editingPost ? '编辑回复' : '发表回复' }}</h3>
            <textarea
              v-model="replyContent"
              placeholder="输入你的回复... 支持Markdown语法"
              rows="6"
            ></textarea>
            <div class="reply-actions">
              <button @click="submitReply" class="primary" :disabled="submitting || !replyContent.trim()">
                {{ submitting ? '提交中...' : (editingPost ? '更新' : '发表回复') }}
              </button>
              <button v-if="editingPost" @click="cancelEdit" class="secondary">取消</button>
            </div>
          </div>

          <div v-else-if="discussion.is_locked" class="locked-notice">
            此讨论已被锁定，无法回复
          </div>
          <div v-else class="login-notice">
            <router-link to="/login">登录</router-link> 后才能回复
          </div>
        </main>

        <!-- 侧边栏 -->
        <aside class="sidebar">
          <div class="sidebar-section">
            <h3>讨论信息</h3>
            <div class="info-item">
              <span class="label">发起人</span>
              <span class="value">{{ discussion.user.username }}</span>
            </div>
            <div class="info-item">
              <span class="label">创建时间</span>
              <span class="value">{{ formatDate(discussion.created_at) }}</span>
            </div>
            <div class="info-item">
              <span class="label">最后回复</span>
              <span class="value">{{ formatDate(discussion.last_posted_at) }}</span>
            </div>
            <div class="info-item">
              <span class="label">回复数</span>
              <span class="value">{{ discussion.comment_count }}</span>
            </div>
          </div>

          <div class="sidebar-section" v-if="canManageDiscussion">
            <h3>管理操作</h3>
            <button @click="togglePin" class="secondary full-width">
              {{ discussion.is_pinned ? '取消置顶' : '置顶' }}
            </button>
            <button @click="toggleLock" class="secondary full-width">
              {{ discussion.is_locked ? '解锁' : '锁定' }}
            </button>
            <button @click="toggleHide" class="secondary full-width">
              {{ discussion.is_hidden ? '显示' : '隐藏' }}
            </button>
            <button @click="deleteDiscussion" class="danger full-width">
              删除讨论
            </button>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/api'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const discussion = ref(null)
const posts = ref([])
const loading = ref(true)
const loadingMore = ref(false)
const hasMore = ref(false)
const currentPage = ref(1)

const replyContent = ref('')
const submitting = ref(false)
const editingPost = ref(null)
const replyingTo = ref(null)

const canManageDiscussion = computed(() => {
  return authStore.user?.is_staff || authStore.user?.id === discussion.value?.user.id
})

onMounted(async () => {
  await loadDiscussion()
  await loadPosts()
})

async function loadDiscussion() {
  try {
    const data = await api.get(`/discussions/${route.params.id}`)
    discussion.value = data
  } catch (error) {
    console.error('加载讨论失败:', error)
  } finally {
    loading.value = false
  }
}

async function loadPosts() {
  try {
    const data = await api.get(`/discussions/${route.params.id}/posts`, {
      params: { page: currentPage.value }
    })
    if (currentPage.value === 1) {
      posts.value = data.data || data.results || data
    } else {
      posts.value.push(...(data.data || data.results || data))
    }
    // 根据分页信息判断是否有更多
    if (data.total && data.page && data.limit) {
      hasMore.value = data.page * data.limit < data.total
    } else {
      hasMore.value = !!data.next
    }
  } catch (error) {
    console.error('加载帖子失败:', error)
  }
}

async function loadMorePosts() {
  loadingMore.value = true
  currentPage.value++
  await loadPosts()
  loadingMore.value = false
}

async function toggleLike(post) {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }

  try {
    if (post.is_liked) {
      await api.delete(`/posts/${post.id}/like`)
      post.likes_count--
      post.is_liked = false
    } else {
      await api.post(`/posts/${post.id}/like`)
      post.likes_count++
      post.is_liked = true
    }
  } catch (error) {
    console.error('点赞失败:', error)
  }
}

function replyToPost(post) {
  replyingTo.value = post
  replyContent.value = `@${post.user.username} `
  document.querySelector('.reply-box textarea').focus()
}

function editPost(post) {
  editingPost.value = post
  replyContent.value = post.content
  document.querySelector('.reply-box textarea').focus()
}

function cancelEdit() {
  editingPost.value = null
  replyingTo.value = null
  replyContent.value = ''
}

async function submitReply() {
  if (!replyContent.value.trim()) return

  submitting.value = true
  try {
    if (editingPost.value) {
      // 编辑帖子
      const data = await api.patch(`/posts/${editingPost.value.id}`, {
        content: replyContent.value
      })
      const index = posts.value.findIndex(p => p.id === editingPost.value.id)
      if (index !== -1) {
        posts.value[index] = data
      }
    } else {
      // 创建新回复
      const data = await api.post(`/discussions/${route.params.id}/posts`, {
        content: replyContent.value
      })
      posts.value.push(data)
      discussion.value.comment_count++
    }

    replyContent.value = ''
    editingPost.value = null
    replyingTo.value = null
  } catch (error) {
    console.error('提交失败:', error)
    alert('提交失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}

async function deletePost(post) {
  if (!confirm('确定要删除这条回复吗？')) return

  try {
    await api.delete(`/posts/${post.id}`)
    posts.value = posts.value.filter(p => p.id !== post.id)
    discussion.value.comment_count--
  } catch (error) {
    console.error('删除失败:', error)
    alert('删除失败，请稍后重试')
  }
}

function canEditPost(post) {
  return authStore.user?.id === post.user.id || authStore.user?.is_staff
}

function canDeletePost(post) {
  return authStore.user?.id === post.user.id || authStore.user?.is_staff
}

async function togglePin() {
  try {
    await api.post(`/discussions/${discussion.value.id}/pin`)
    discussion.value.is_pinned = !discussion.value.is_pinned
  } catch (error) {
    console.error('操作失败:', error)
  }
}

async function toggleLock() {
  try {
    await api.post(`/discussions/${discussion.value.id}/lock`)
    discussion.value.is_locked = !discussion.value.is_locked
  } catch (error) {
    console.error('操作失败:', error)
  }
}

async function toggleHide() {
  try {
    await api.post(`/discussions/${discussion.value.id}/hide`)
    discussion.value.is_hidden = !discussion.value.is_hidden
  } catch (error) {
    console.error('操作失败:', error)
  }
}

async function deleteDiscussion() {
  if (!confirm('确定要删除这个讨论吗？此操作不可恢复！')) return

  try {
    await api.delete(`/discussions/${discussion.value.id}/`)
    router.push('/discussions')
  } catch (error) {
    console.error('删除失败:', error)
    alert('删除失败，请稍后重试')
  }
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
.discussion-detail-page {
  padding: 30px 0;
  background: #f5f5f5;
  min-height: calc(100vh - 200px);
}

.layout {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 30px;
}

.main-content {
  background: white;
  padding: 30px;
  border-radius: 8px;
}

.discussion-header {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #f0f0f0;
}

.discussion-badges {
  display: flex;
  gap: 8px;
  margin-bottom: 15px;
}

.badge {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.badge-pinned {
  background: #ffc107;
  color: white;
}

.badge-locked {
  background: #999;
  color: white;
}

.badge-hidden {
  background: #e74c3c;
  color: white;
}

.discussion-header h1 {
  font-size: 32px;
  color: #333;
  margin-bottom: 15px;
}

.discussion-tags {
  display: flex;
  gap: 8px;
}

.tag {
  padding: 4px 12px;
  border-radius: 4px;
  color: white;
  font-size: 13px;
}

.posts {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 30px;
}

.post-item {
  display: flex;
  gap: 20px;
  padding: 20px;
  background: #fafafa;
  border-radius: 8px;
  transition: all 0.2s;
}

.post-item:hover {
  background: #f5f5f5;
}

.post-item.is-hidden {
  opacity: 0.5;
}

.post-avatar img {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.post-avatar .avatar-placeholder {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #667eea;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 600;
}

.post-content {
  flex: 1;
}

.post-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  font-size: 14px;
}

.post-author {
  font-weight: 600;
  color: #667eea;
}

.post-number {
  color: #999;
}

.post-time {
  color: #999;
}

.post-edited {
  color: #999;
  font-style: italic;
}

.post-body {
  margin-bottom: 15px;
  line-height: 1.6;
  color: #333;
}

.post-body :deep(pre) {
  background: #2d2d2d;
  color: #f8f8f2;
  padding: 15px;
  border-radius: 6px;
  overflow-x: auto;
}

.post-body :deep(code) {
  background: #f0f0f0;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
}

.post-body :deep(blockquote) {
  border-left: 4px solid #667eea;
  padding-left: 15px;
  margin: 15px 0;
  color: #666;
}

.post-footer {
  display: flex;
  gap: 15px;
}

.post-action {
  padding: 6px 12px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.post-action:hover {
  border-color: #667eea;
  color: #667eea;
}

.post-action.is-liked {
  background: #ffe0e0;
  border-color: #ff6b6b;
  color: #ff6b6b;
}

.post-action.danger:hover {
  border-color: #e74c3c;
  color: #e74c3c;
}

.load-more {
  text-align: center;
  margin-bottom: 30px;
}

.reply-box {
  padding: 25px;
  background: #fafafa;
  border-radius: 8px;
  margin-bottom: 20px;
}

.reply-box h3 {
  margin-bottom: 15px;
  color: #333;
}

.reply-box textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
}

.reply-box textarea:focus {
  outline: none;
  border-color: #667eea;
}

.reply-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.locked-notice, .login-notice {
  text-align: center;
  padding: 20px;
  background: #fff3cd;
  border-radius: 6px;
  color: #856404;
}

.sidebar {
  height: fit-content;
  position: sticky;
  top: 20px;
}

.sidebar-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.sidebar-section h3 {
  font-size: 16px;
  margin-bottom: 15px;
  color: #333;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-item:last-child {
  border-bottom: none;
}

.info-item .label {
  color: #999;
  font-size: 14px;
}

.info-item .value {
  color: #333;
  font-size: 14px;
  font-weight: 500;
}

.sidebar-section button {
  margin-bottom: 10px;
}

.sidebar-section button:last-child {
  margin-bottom: 0;
}

.loading, .error {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

@media (max-width: 768px) {
  .layout {
    grid-template-columns: 1fr;
  }

  .sidebar {
    position: static;
  }

  .post-item {
    flex-direction: column;
  }
}
</style>
