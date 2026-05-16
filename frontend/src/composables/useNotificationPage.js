import { computed, ref } from 'vue'
import { getEmptyState, getStateBlock, getUiCopy } from '@/forum/registry'
import { useNotificationBulkActions } from '@/composables/useNotificationBulkActions'
import { usePaginatedListState } from '@/composables/usePaginatedListState'
import { getResolvedNotificationTypes } from '@/forum/notificationTypes'
import { useRoutePagination } from '@/composables/useRoutePagination'
import { useNotificationRouteState } from '@/composables/useNotificationRouteState'
import { resolveNotificationPath, useNotificationGroups } from '@/composables/useNotificationPresentation'

export function useNotificationPage({
  modalStore,
  notificationStore,
  route,
  router
}) {
  const routeState = useNotificationRouteState({ route, router })
  const marking = ref(false)
  const totalPages = ref(1)
  const totalCount = ref(0)
  const activeType = routeState.activeType
  const currentPage = routeState.currentPage
  const unreadOnly = routeState.unreadOnly
  const viewMode = routeState.viewMode
  const routePagination = useRoutePagination({
    page: currentPage,
    push: routeState.push,
    pageStateKey: 'currentPage',
  })
  const notifications = computed(() => notificationStore.notifications)
  const groupedNotifications = useNotificationGroups(notifications, '论坛')
  const filteredUnreadCount = computed(() => notifications.value.filter(item => !item.is_read).length)
  const filteredReadCount = computed(() => notifications.value.length - filteredUnreadCount.value)
  const hasActiveFilter = computed(() => unreadOnly.value || Boolean(activeType.value))
  const listState = usePaginatedListState({
    watchSources: () => [currentPage.value, activeType.value, unreadOnly.value],
    initialLoading: true,
    async load() {
      const data = await notificationStore.fetchNotifications({
        page: currentPage.value,
        ...(activeType.value ? { type: activeType.value } : {}),
        ...(unreadOnly.value ? { is_read: false } : {})
      })
      totalCount.value = Number(data.total || notifications.value.length || 0)
      totalPages.value = Math.max(1, Math.ceil((data.total || notifications.value.length) / (data.limit || 20)))
      return data
    },
  })
  const loading = listState.loading
  const loadError = listState.loadError
  const emptyStateText = computed(() => {
    const emptyState = getEmptyState({
      surface: 'notifications-page-empty',
      notifications: notifications.value,
      unreadOnly: unreadOnly.value,
      activeType: activeType.value,
    })

    return emptyState?.text || '暂无通知'
  })
  const loadingStateText = computed(() => {
    const stateBlock = getStateBlock({
      surface: 'notifications-page-loading',
      loading: loading.value,
      activeType: activeType.value,
      unreadOnly: unreadOnly.value,
    })

    return stateBlock?.text || '正在加载通知...'
  })

  const notificationTypeItems = computed(() => {
    const registeredItems = getResolvedNotificationTypes().map(item => ({
      value: item.type,
      label: item.label,
      count: formatTypeCount(item.type),
    }))

    return [
      {
        value: '',
        label: getUiCopy({
          surface: 'notification-filter-all-label',
          count: formatSummaryCount(),
        })?.text || '全部通知',
        count: formatSummaryCount()
      },
      ...registeredItems,
    ]
  })

  const viewModeItems = computed(() => {
    return [
      {
        value: 'timeline',
        label: getUiCopy({
          surface: 'notification-view-mode-timeline',
        })?.text || '时间流'
      },
      {
        value: 'grouped',
        label: getUiCopy({
          surface: 'notification-view-mode-grouped',
        })?.text || '按讨论分组'
      },
    ]
  })

  function getNotificationUiCopy(surface, context = {}, fallback = '') {
    return getUiCopy({
      surface,
      ...context,
    })?.text || fallback
  }

  function getNotificationErrorMessage(error, fallback = getNotificationUiCopy('notification-error-retry-message', {}, '请稍后重试')) {
    return error.response?.data?.error || error.response?.data?.detail || error.message || fallback
  }

  async function showNotificationActionError(error, titleFallback = '操作失败') {
    await modalStore.alert({
      title: getNotificationUiCopy('notification-alert-action-failed-title', {}, titleFallback),
      message: getNotificationErrorMessage(error),
      tone: 'danger'
    })
  }

  function formatSummaryCount() {
    return getNotificationUiCopy('notification-summary-count', {
      unreadOnly: unreadOnly.value,
      count: unreadOnly.value
        ? notifications.value.length
        : (totalCount.value || notifications.value.length || 0),
    }, unreadOnly.value
      ? `${notifications.value.length || 0} 未读`
      : String(totalCount.value || notifications.value.length || 0))
  }

  function formatTypeCount(type) {
    const total = Number(notificationStore.typeCounts?.[type] || 0)
    const unread = Number(notificationStore.unreadTypeCounts?.[type] || 0)
    return getNotificationUiCopy('notification-type-count', {
      total,
      unread,
      type,
    }, unread > 0 ? `${total} / ${unread} 未读` : String(total))
  }

  async function changeType(type) {
    const nextType = typeof type === 'string' ? type.trim() : ''
    if (nextType === activeType.value) {
      return
    }

    await routePagination.resetPage({
      activeType: nextType,
    })
  }

  async function toggleUnreadOnly() {
    await routePagination.resetPage({
      unreadOnly: !unreadOnly.value,
    })
  }

  async function changeViewMode(mode) {
    const nextMode = mode === 'grouped' ? 'grouped' : 'timeline'
    if (nextMode === viewMode.value) {
      return
    }

    await routePagination.resetPage({
      viewMode: nextMode,
    })
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

  const bulkActions = useNotificationBulkActions({
    activeType,
    filteredReadCount,
    filteredUnreadCount,
    getNotificationUiCopy,
    hasActiveFilter,
    listState,
    marking,
    modalStore,
    notificationStore,
    showNotificationActionError,
  })

  async function deleteNotification(notificationId) {
    const confirmed = await modalStore.confirm({
      title: getNotificationUiCopy('notification-confirm-delete-title', {}, '删除通知'),
      message: getNotificationUiCopy('notification-confirm-delete-message', {}, '确定要删除这条通知吗？'),
      confirmText: getNotificationUiCopy('notification-confirm-delete-confirm', {}, '删除'),
      cancelText: getNotificationUiCopy('notification-confirm-cancel', {}, '取消'),
      tone: 'danger'
    })
    if (!confirmed) return

    try {
      await notificationStore.deleteNotification(notificationId)
    } catch (error) {
      console.error('删除失败:', error)
      await modalStore.alert({
        title: getNotificationUiCopy('notification-alert-delete-failed-title', {}, '删除失败'),
        message: getNotificationErrorMessage(error),
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
    await routePagination.changePage(page)
  }

  return {
    notifications,
    emptyStateText,
    loadingStateText,
    loading,
    loadError,
    marking,
    currentPage,
    totalPages,
    activeType,
    unreadOnly,
    viewMode,
    filteredUnreadCount,
    filteredReadCount,
    hasActiveFilter,
    notificationTypeItems,
    viewModeItems,
    groupedNotifications,
    markAsRead,
    markAllAsRead: bulkActions.markAllAsRead,
    clearReadNotifications: bulkActions.clearReadNotifications,
    markGroupAsRead: bulkActions.markGroupAsRead,
    clearGroupReadNotifications: bulkActions.clearGroupReadNotifications,
    deleteNotification,
    handleNotificationClick,
    changeType,
    changeViewMode,
    toggleUnreadOnly,
    changePage
  }
}
