import { computed, ref } from 'vue'
import { getEmptyState, getStateBlock, getUiCopy } from '@/forum/registry'
import {
  getNotificationPresentationModel,
  resolveNotificationPath,
  useNotificationGroups
} from '@/composables/useNotificationPresentation'
import { useHeaderNotificationActions } from '@/composables/useHeaderNotificationActions'
import { getResolvedNotificationTypes } from '@/forum/notificationTypes'

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
  const notificationTypeSummaries = computed(() => {
    return getResolvedNotificationTypes()
      .map(item => ({
        type: item.type,
        label: item.label,
        total: Number(notificationStore.typeCounts?.[item.type] || 0),
        unread: Number(notificationStore.unreadTypeCounts?.[item.type] || 0),
      }))
      .filter(item => item.total > 0 || item.unread > 0)
      .slice(0, 4)
  })
  const emptyStateText = computed(() => {
    const emptyState = getEmptyState({
      surface: 'notifications-menu-empty',
      notifications: notificationItems.value,
    })

    return emptyState?.text || '暂无通知'
  })
  const loadingStateText = computed(() => {
    const stateBlock = getStateBlock({
      surface: 'notifications-menu-loading',
      loading: notificationStore.loading,
      notifications: notificationItems.value,
    })

    return stateBlock?.text || '加载中...'
  })

  function getNotificationUiCopy(surface, context = {}, fallback = '') {
    return getUiCopy({
      surface,
      ...context,
    })?.text || fallback
  }

  function getNotificationErrorMessage(error, fallback = getNotificationUiCopy('notifications-menu-action-retry-message', {}, '请稍后重试')) {
    return error.response?.data?.error || error.response?.data?.detail || error.message || fallback
  }

  async function showHeaderNotificationError(error, fallback = '操作失败') {
    if (!modalStore) return

    await modalStore.alert({
      title: getNotificationUiCopy('notifications-menu-action-failed-title', {}, fallback),
      message: getNotificationErrorMessage(error),
      tone: 'danger'
    })
  }

  function getNotificationPresentation(notification) {
    return getNotificationPresentationModel(notification)
  }

  const {
    toggleNotifications,
    markAllNotificationsAsRead,
    clearReadNotifications,
    handleNotificationClick,
    openNotificationGroup,
    openNotificationsPage,
    openNotificationsPageByType,
    closeNotifications,
  } = useHeaderNotificationActions({
    actionMessage,
    actionTone,
    clearingRead,
    getNotificationErrorMessage,
    getNotificationUiCopy,
    hasReadNotifications,
    markingAllRead,
    modalStore,
    notificationStore,
    resolvePath: resolveNotificationPath,
    router,
    showHeaderNotificationError,
    showNotifications,
  })

  return {
    showNotifications,
    notificationItems,
    hasReadNotifications,
    notificationGroups,
    notificationTypeSummaries,
    emptyStateText,
    loadingStateText,
    actionMessage,
    actionTone,
    markingAllRead,
    clearingRead,
    getNotificationPresentation,
    toggleNotifications,
    markAllNotificationsAsRead,
    clearReadNotifications,
    handleNotificationClick,
    openNotificationGroup,
    openNotificationsPage,
    openNotificationsPageByType,
    closeNotifications
  }
}
