import { computed, ref } from 'vue'
import { getEmptyState, getStateBlock, getUiCopy } from '@/forum/registry'
import { useNotificationBulkActions } from '@/composables/useNotificationBulkActions'
import { useNotificationItemActions } from '@/composables/useNotificationItemActions'
import { useNotificationRouteActions } from '@/composables/useNotificationRouteActions'
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
  const routeActions = useNotificationRouteActions({
    activeType,
    currentPage,
    routePagination,
    unreadOnly,
    viewMode,
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
  const itemActions = useNotificationItemActions({
    getNotificationErrorMessage,
    getNotificationUiCopy,
    modalStore,
    notificationStore,
    notifications,
    resolvePath: resolveNotificationPath,
    router,
  })

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
    markAsRead: itemActions.markAsRead,
    markAllAsRead: bulkActions.markAllAsRead,
    clearReadNotifications: bulkActions.clearReadNotifications,
    markGroupAsRead: bulkActions.markGroupAsRead,
    clearGroupReadNotifications: bulkActions.clearGroupReadNotifications,
    deleteNotification: itemActions.deleteNotification,
    handleNotificationClick: itemActions.handleNotificationClick,
    changeType: routeActions.changeType,
    changeViewMode: routeActions.changeViewMode,
    toggleUnreadOnly: routeActions.toggleUnreadOnly,
    changePage: routeActions.changePage
  }
}
