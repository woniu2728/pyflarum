import { computed, ref } from 'vue'
import { getEmptyState, getStateBlock, getUiCopy } from '@/forum/registry'
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

  async function markAllAsRead() {
    const unreadCount = filteredUnreadCount.value
    if (unreadCount === 0) return

    const confirmed = await modalStore.confirm({
      title: getNotificationUiCopy(
        'notification-confirm-mark-all-title',
        { hasActiveFilter: hasActiveFilter.value },
        hasActiveFilter.value ? '标记当前筛选结果为已读' : '全部标记为已读'
      ),
      message: getNotificationUiCopy(
        'notification-confirm-mark-all-message',
        { hasActiveFilter: hasActiveFilter.value, unreadCount },
        hasActiveFilter.value
          ? `确定将当前筛选结果中的 ${unreadCount} 条未读通知标记为已读吗？`
          : `确定将当前 ${unreadCount} 条未读通知标记为已读吗？`
      ),
      confirmText: getNotificationUiCopy('notification-confirm-mark-all-confirm', {}, '标记已读'),
      cancelText: getNotificationUiCopy('notification-confirm-cancel', {}, '取消'),
      tone: 'primary'
    })
    if (!confirmed) return

    marking.value = true

    try {
      if (hasActiveFilter.value) {
        await notificationStore.markFilteredAsRead({
          type: activeType.value,
        })
      } else {
        await notificationStore.markAllAsRead()
      }
      await listState.refresh({
        mode: 'initial',
        forceLoading: true,
      })
      await modalStore.alert({
        title: getNotificationUiCopy('notification-alert-mark-all-success-title', {}, '已全部标记为已读'),
        message: getNotificationUiCopy(
          'notification-alert-mark-all-success-message',
          { hasActiveFilter: hasActiveFilter.value },
          hasActiveFilter.value ? '当前筛选范围内的未读通知已更新为已读。' : '当前页面的未读通知已更新为已读。'
        ),
        tone: 'success'
      })
    } catch (error) {
      console.error('标记失败:', error)
      await showNotificationActionError(error)
    } finally {
      marking.value = false
    }
  }

  async function clearReadNotifications() {
    const readCount = filteredReadCount.value
    if (readCount === 0) return

    const confirmed = await modalStore.confirm({
      title: getNotificationUiCopy(
        'notification-confirm-clear-read-title',
        { hasActiveFilter: hasActiveFilter.value },
        hasActiveFilter.value ? '清除当前筛选中的已读通知' : '清除当前页已读通知'
      ),
      message: getNotificationUiCopy(
        'notification-confirm-clear-read-message',
        { hasActiveFilter: hasActiveFilter.value, readCount },
        hasActiveFilter.value
          ? `确定清除当前筛选结果中的 ${readCount} 条已读通知吗？`
          : `确定清除当前页中的 ${readCount} 条已读通知吗？`
      ),
      confirmText: getNotificationUiCopy('notification-confirm-clear-read-confirm', {}, '清除已读'),
      cancelText: getNotificationUiCopy('notification-confirm-cancel', {}, '取消'),
      tone: 'danger'
    })
    if (!confirmed) return

    marking.value = true

    try {
      if (hasActiveFilter.value) {
        await notificationStore.clearFilteredReadNotifications({
          type: activeType.value,
        })
      } else {
        await notificationStore.clearReadNotifications()
      }
      await listState.refresh({
        mode: 'initial',
        forceLoading: true,
      })
      await modalStore.alert({
        title: getNotificationUiCopy('notification-alert-clear-read-success-title', {}, '已清除已读通知'),
        message: getNotificationUiCopy('notification-alert-clear-read-success-message', {}, '当前范围内的已读通知已清除。'),
        tone: 'success'
      })
    } catch (error) {
      console.error('清除失败:', error)
      await showNotificationActionError(error)
    } finally {
      marking.value = false
    }
  }

  async function markGroupAsRead(group) {
    const discussionId = Number(group?.discussionId || 0)
    const unreadCount = Array.isArray(group?.items) ? group.items.filter(item => !item.is_read).length : 0
    if (!discussionId || unreadCount === 0) return

    const confirmed = await modalStore.confirm({
      title: getNotificationUiCopy('notification-confirm-mark-group-title', {}, '标记该讨论通知为已读'),
      message: getNotificationUiCopy(
        'notification-confirm-mark-group-message',
        { groupTitle: group.title, unreadCount },
        `确定将“${group.title}”下的 ${unreadCount} 条未读通知标记为已读吗？`
      ),
      confirmText: getNotificationUiCopy('notification-confirm-mark-all-confirm', {}, '标记已读'),
      cancelText: getNotificationUiCopy('notification-confirm-cancel', {}, '取消'),
      tone: 'primary'
    })
    if (!confirmed) return

    marking.value = true
    try {
      await notificationStore.markFilteredAsRead({
        type: activeType.value,
        discussionId,
      })
      await listState.refresh({
        mode: 'initial',
        forceLoading: true,
      })
    } catch (error) {
      console.error('分组标记失败:', error)
      await showNotificationActionError(error)
    } finally {
      marking.value = false
    }
  }

  async function clearGroupReadNotifications(group) {
    const discussionId = Number(group?.discussionId || 0)
    const readCount = Array.isArray(group?.items) ? group.items.filter(item => item.is_read).length : 0
    if (!discussionId || readCount === 0) return

    const confirmed = await modalStore.confirm({
      title: getNotificationUiCopy('notification-confirm-clear-group-title', {}, '清除该讨论中的已读通知'),
      message: getNotificationUiCopy(
        'notification-confirm-clear-group-message',
        { groupTitle: group.title, readCount },
        `确定清除“${group.title}”下的 ${readCount} 条已读通知吗？`
      ),
      confirmText: getNotificationUiCopy('notification-confirm-clear-read-confirm', {}, '清除已读'),
      cancelText: getNotificationUiCopy('notification-confirm-cancel', {}, '取消'),
      tone: 'danger'
    })
    if (!confirmed) return

    marking.value = true
    try {
      await notificationStore.clearFilteredReadNotifications({
        type: activeType.value,
        discussionId,
      })
      await listState.refresh({
        mode: 'initial',
        forceLoading: true,
      })
    } catch (error) {
      console.error('分组清除失败:', error)
      await showNotificationActionError(error)
    } finally {
      marking.value = false
    }
  }

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
    markAllAsRead,
    clearReadNotifications,
    markGroupAsRead,
    clearGroupReadNotifications,
    deleteNotification,
    handleNotificationClick,
    changeType,
    changeViewMode,
    toggleUnreadOnly,
    changePage
  }
}
