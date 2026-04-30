import { computed, ref } from 'vue'
import {
  resolveNotificationPath,
  useNotificationGroups
} from '@/composables/useNotificationPresentation'

export function useHeaderNotifications({
  modalStore,
  notificationStore,
  forumTitle,
  router
}) {
  const showNotifications = ref(false)
  const actionMessage = ref('')
  const actionTone = ref('info')
  const markingAllRead = ref(false)
  const clearingRead = ref(false)
  const notificationItems = computed(() => notificationStore.notifications.slice(0, 8))
  const hasReadNotifications = computed(() => notificationStore.readCount > 0)
  const notificationGroups = useNotificationGroups(notificationItems, forumTitle || '论坛')

  async function refreshMenuNotifications() {
    await notificationStore.fetchNotifications({ limit: 8 })
  }

  async function toggleNotifications() {
    showNotifications.value = !showNotifications.value

    if (!showNotifications.value) return

    actionMessage.value = ''

    try {
      await refreshMenuNotifications()
    } catch (error) {
      console.error('加载通知失败:', error)
    }
  }

  async function markAllNotificationsAsRead() {
    markingAllRead.value = true
    try {
      const result = await notificationStore.markAllAsRead()
      await refreshMenuNotifications()
      actionTone.value = 'success'
      actionMessage.value = result?.message || '已全部标记为已读'
    } catch (error) {
      console.error('全部标记已读失败:', error)
      actionTone.value = 'danger'
      actionMessage.value = error.response?.data?.error || error.message || '全部标记已读失败'
      if (modalStore) {
        await modalStore.alert({
          title: '操作失败',
          message: actionMessage.value,
          tone: 'danger'
        })
      }
    } finally {
      markingAllRead.value = false
    }
  }

  async function clearReadNotifications() {
    clearingRead.value = true
    try {
      const result = await notificationStore.clearReadNotifications()
      await refreshMenuNotifications()
      actionTone.value = 'success'
      actionMessage.value = result?.message || '已清除已读通知'
    } catch (error) {
      console.error('清除已读通知失败:', error)
      actionTone.value = 'danger'
      actionMessage.value = error.response?.data?.error || error.message || '清除已读通知失败'
      if (modalStore) {
        await modalStore.alert({
          title: '操作失败',
          message: actionMessage.value,
          tone: 'danger'
        })
      }
    } finally {
      clearingRead.value = false
    }
  }

  async function handleNotificationClick(notification) {
    try {
      if (!notification.is_read) {
        await notificationStore.markAsRead(notification.id)
      }
    } catch (error) {
      console.error('标记通知已读失败:', error)
    }

    showNotifications.value = false
    router.push(await resolveNotificationPath(notification))
  }

  function openNotificationGroup(group) {
    showNotifications.value = false
    router.push(group.discussionId ? `/d/${group.discussionId}` : '/notifications')
  }

  function openNotificationsPage() {
    showNotifications.value = false
    router.push('/notifications')
  }

  function closeNotifications() {
    showNotifications.value = false
  }

  return {
    showNotifications,
    notificationItems,
    hasReadNotifications,
    notificationGroups,
    actionMessage,
    actionTone,
    markingAllRead,
    clearingRead,
    toggleNotifications,
    markAllNotificationsAsRead,
    clearReadNotifications,
    handleNotificationClick,
    openNotificationGroup,
    openNotificationsPage,
    closeNotifications
  }
}
