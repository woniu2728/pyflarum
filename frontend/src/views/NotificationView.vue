<template>
  <div class="notification-page">
    <div class="container">
      <div class="notification-card">
        <div class="header">
          <h1>通知</h1>
          <button
            v-if="notifications.length > 0"
            @click="markAllAsRead"
            class="secondary"
            :disabled="marking"
          >
            全部标记为已读
          </button>
        </div>

        <div v-if="loading" class="loading">加载中...</div>
        <div v-else-if="notifications.length === 0" class="empty">
          <div class="empty-icon">🔔</div>
          <p>暂无通知</p>
        </div>
        <div v-else class="notification-list">
          <div
            v-for="notification in notifications"
            :key="notification.id"
            class="notification-item"
            :class="{ 'is-read': notification.is_read }"
            @click="handleNotificationClick(notification)"
          >
            <div class="notification-icon">
              {{ getNotificationIcon(notification.type) }}
            </div>

            <div class="notification-content">
              <div class="notification-message">
                {{ getNotificationMessage(notification) }}
              </div>
              <div class="notification-time">
                {{ formatDate(notification.created_at) }}
              </div>
            </div>

            <div class="notification-actions">
              <button
                v-if="!notification.is_read"
                @click.stop="markAsRead(notification.id)"
                class="mark-read-btn"
                title="标记为已读"
              >
                ✓
              </button>
              <button
                @click.stop="deleteNotification(notification.id)"
                class="delete-btn"
                title="删除"
              >
                ×
              </button>
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
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationStore } from '@/stores/notification'
import api from '@/api'

const router = useRouter()
const notificationStore = useNotificationStore()

const notifications = ref([])
const loading = ref(true)
const marking = ref(false)
const currentPage = ref(1)
const totalPages = ref(1)

onMounted(async () => {
  await loadNotifications()
})

async function loadNotifications() {
  loading.value = true
  try {
    const data = await api.get('/notifications/', {
      params: { page: currentPage.value }
    })
    notifications.value = data.results || data
    if (data.count) {
      totalPages.value = Math.ceil(data.count / 20)
    }
  } catch (error) {
    console.error('加载通知失败:', error)
  } finally {
    loading.value = false
  }
}

async function markAsRead(notificationId) {
  try {
    await api.post(`/notifications/${notificationId}/read`)
    const notification = notifications.value.find(n => n.id === notificationId)
    if (notification) {
      notification.is_read = true
      notificationStore.unreadCount--
    }
  } catch (error) {
    console.error('标记失败:', error)
  }
}

async function markAllAsRead() {
  marking.value = true
  try {
    await api.post('/notifications/read-all')
    notifications.value.forEach(n => {
      n.is_read = true
    })
    notificationStore.unreadCount = 0
  } catch (error) {
    console.error('标记失败:', error)
  } finally {
    marking.value = false
  }
}

async function deleteNotification(notificationId) {
  if (!confirm('确定要删除这条通知吗？')) return

  try {
    await api.delete(`/notifications/${notificationId}`)
    notifications.value = notifications.value.filter(n => n.id !== notificationId)
  } catch (error) {
    console.error('删除失败:', error)
  }
}

function handleNotificationClick(notification) {
  // 标记为已读
  if (!notification.is_read) {
    markAsRead(notification.id)
  }

  // 跳转到相关页面
  if (notification.data?.discussion_id) {
    router.push(`/discussions/${notification.data.discussion_id}`)
  } else if (notification.data?.post_id) {
    // 需要先获取帖子所属的讨论ID
    router.push(`/discussions/${notification.data.discussion_id || ''}`)
  }
}

function changePage(page) {
  currentPage.value = page
  loadNotifications()
  window.scrollTo(0, 0)
}

function getNotificationIcon(type) {
  const icons = {
    discussionReply: '💬',
    postLiked: '❤️',
    userMentioned: '@',
    discussionCreated: '📝',
    postCreated: '💭',
    default: '🔔'
  }
  return icons[type] || icons.default
}

function getNotificationMessage(notification) {
  const { type, data } = notification

  switch (type) {
    case 'discussionReply':
      return `${data?.from_user?.username || '有人'} 回复了你的讨论 "${data?.discussion_title || ''}"`
    case 'postLiked':
      return `${data?.from_user?.username || '有人'} 点赞了你的回复`
    case 'userMentioned':
      return `${data?.from_user?.username || '有人'} 在回复中提到了你`
    case 'discussionCreated':
      return `${data?.from_user?.username || '有人'} 发起了新讨论 "${data?.discussion_title || ''}"`
    case 'postCreated':
      return `${data?.from_user?.username || '有人'} 发表了新回复`
    default:
      return notification.message || '你有新通知'
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
.notification-page {
  padding: 30px 0;
  background: #f5f5f5;
  min-height: calc(100vh - 200px);
}

.notification-card {
  background: white;
  padding: 30px;
  border-radius: 8px;
  max-width: 800px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  padding-bottom: 20px;
  border-bottom: 2px solid #f0f0f0;
}

.header h1 {
  font-size: 28px;
  color: #333;
}

.notification-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  padding: 18px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
}

.notification-item:hover {
  border-color: #667eea;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
}

.notification-item.is-read {
  background: #fafafa;
  opacity: 0.7;
}

.notification-icon {
  font-size: 24px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f0ff;
  border-radius: 50%;
  flex-shrink: 0;
}

.notification-content {
  flex: 1;
}

.notification-message {
  color: #333;
  line-height: 1.6;
  margin-bottom: 6px;
}

.notification-time {
  font-size: 13px;
  color: #999;
}

.notification-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.mark-read-btn,
.delete-btn {
  width: 28px;
  height: 28px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: all 0.2s;
}

.mark-read-btn:hover {
  border-color: #667eea;
  color: #667eea;
  background: #f0f0ff;
}

.delete-btn:hover {
  border-color: #e74c3c;
  color: #e74c3c;
  background: #fee;
}

.loading, .empty {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
  opacity: 0.3;
}

.empty p {
  font-size: 16px;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

.page-info {
  color: #666;
}

@media (max-width: 768px) {
  .notification-card {
    padding: 20px;
  }

  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }

  .notification-item {
    padding: 15px;
  }

  .notification-icon {
    width: 36px;
    height: 36px;
    font-size: 20px;
  }
}
</style>
