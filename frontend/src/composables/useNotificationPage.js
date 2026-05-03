import { onMounted, ref } from 'vue'
import api from '@/api'
import { resolveNotificationPath } from '@/composables/useNotificationPresentation'
import { unwrapList } from '@/utils/forum'

export function useNotificationPage({
  modalStore,
  notificationStore,
  router
}) {
  const notifications = ref([])
  const loading = ref(true)
  const loadError = ref('')
  const marking = ref(false)
  const currentPage = ref(1)
  const totalPages = ref(1)

  onMounted(async () => {
    await loadNotifications()
  })

  async function loadNotifications() {
    loading.value = true
    loadError.value = ''

    try {
      const data = await api.get('/notifications', {
        params: { page: currentPage.value }
      })
      notifications.value = unwrapList(data)
      totalPages.value = Math.max(1, Math.ceil((data.total || notifications.value.length) / (data.limit || 20)))
      notificationStore.unreadCount = data.unread_count || 0
    } catch (error) {
      console.error('加载通知失败:', error)
      loadError.value = error.response?.data?.error || error.message || '加载通知失败，请稍后重试'
      notifications.value = []
    } finally {
      loading.value = false
    }
  }

  async function markAsRead(notificationId) {
    try {
      await notificationStore.markAsRead(notificationId)
      const notification = notifications.value.find(item => item.id === notificationId)
      if (notification) {
        notification.is_read = true
      }
    } catch (error) {
      console.error('标记失败:', error)
    }
  }

  async function markAllAsRead() {
    const unreadCount = notifications.value.filter(notification => !notification.is_read).length
    if (unreadCount === 0) return

    const confirmed = await modalStore.confirm({
      title: '全部标记为已读',
      message: `确定将当前 ${unreadCount} 条未读通知标记为已读吗？`,
      confirmText: '标记已读',
      cancelText: '取消',
      tone: 'primary'
    })
    if (!confirmed) return

    marking.value = true

    try {
      await notificationStore.markAllAsRead()
      notifications.value.forEach(notification => {
        notification.is_read = true
      })
      await modalStore.alert({
        title: '已全部标记为已读',
        message: '当前页面的未读通知已更新为已读。',
        tone: 'success'
      })
    } catch (error) {
      console.error('标记失败:', error)
      await modalStore.alert({
        title: '操作失败',
        message: error.response?.data?.error || error.message || '请稍后重试',
        tone: 'danger'
      })
    } finally {
      marking.value = false
    }
  }

  async function deleteNotification(notificationId) {
    const confirmed = await modalStore.confirm({
      title: '删除通知',
      message: '确定要删除这条通知吗？',
      confirmText: '删除',
      cancelText: '取消',
      tone: 'danger'
    })
    if (!confirmed) return

    try {
      await notificationStore.deleteNotification(notificationId)
      notifications.value = notifications.value.filter(notification => notification.id !== notificationId)
    } catch (error) {
      console.error('删除失败:', error)
      await modalStore.alert({
        title: '删除失败',
        message: error.response?.data?.error || error.message || '请稍后重试',
        tone: 'danger'
      })
    }
  }

  async function handleNotificationClick(notification) {
    if (!notification.is_read) {
      markAsRead(notification.id)
    }

    router.push(await resolveNotificationPath(notification))
  }

  async function changePage(page) {
    currentPage.value = page
    await loadNotifications()

    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0)
    }
  }

  return {
    notifications,
    loading,
    loadError,
    marking,
    currentPage,
    totalPages,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    handleNotificationClick,
    changePage
  }
}
