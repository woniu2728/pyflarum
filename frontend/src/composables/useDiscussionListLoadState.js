import { getUiCopy } from '@/forum/registry'
import { usePaginatedListState } from '@/composables/usePaginatedListState'

export function useDiscussionListLoadState({
  modalStore,
  resourceState,
  route,
  searchQuery,
  sortBy,
  listFilter,
}) {
  const listState = usePaginatedListState({
    watchSources: () => [route.name, route.params.slug, searchQuery.value, sortBy.value, listFilter.value],
    initialLoading: true,
    reset: resourceState.reset,
    async load({ mode }) {
      if (mode === 'initial') {
        await resourceState.loadInitialResources()
        return null
      }

      if (mode === 'append') {
        await resourceState.loadMoreDiscussions()
        return null
      }

      await resourceState.refreshDiscussions()
      return null
    },
  })

  function uiText(surface, fallback, context = {}) {
    return getUiCopy({
      surface,
      ...context,
    })?.text || fallback
  }

  function getDiscussionListErrorMessage(error, fallback = uiText('discussion-list-action-retry-message', '请稍后重试')) {
    return error.response?.data?.error || error.response?.data?.detail || error.message || fallback
  }

  async function showDiscussionListError(actionType, error, fallback = uiText('discussion-list-action-retry-message', '请稍后重试')) {
    await modalStore.alert({
      title: uiText('discussion-list-action-failed-title', '操作失败', { actionType }),
      message: getDiscussionListErrorMessage(error, fallback),
      tone: 'danger'
    })
  }

  async function refreshPageData() {
    try {
      await listState.refresh({
        mode: 'initial',
        forceLoading: true,
      })
    } catch (error) {
      resourceState.reset()
      console.error('加载首页列表失败:', error)
    }
  }

  async function refreshDiscussionList() {
    try {
      await listState.refresh({
        mode: 'refresh',
      })
    } catch (error) {
      console.error('刷新讨论列表失败:', error)
      await showDiscussionListError('refresh', error)
    }
  }

  async function loadMore() {
    try {
      await listState.refresh({
        mode: 'append',
      })
    } catch (error) {
      console.error('加载更多讨论失败:', error)
      await showDiscussionListError('load-more', error)
    }
  }

  return {
    loadMore,
    loading: listState.loading,
    loadingMore: listState.loadingMore,
    refreshDiscussionList,
    refreshPageData,
    refreshing: listState.refreshing,
    uiText,
  }
}
