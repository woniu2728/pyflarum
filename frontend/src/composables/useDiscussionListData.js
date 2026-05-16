import { computed, ref } from 'vue'
import api from '@/api'
import { getUiCopy } from '@/forum/registry'
import { useDiscussionListResourceState } from '@/composables/useDiscussionListResourceState'
import { useDiscussionListRouteState } from '@/composables/useDiscussionListRouteState'
import { useDiscussionListRealtimeState } from '@/composables/useDiscussionListRealtimeState'
import { usePaginatedListState } from '@/composables/usePaginatedListState'
import { useForumRealtimeStore } from '@/stores/forumRealtime'
import { useResourceStore } from '@/stores/resource'

export function useDiscussionListData({
  authStore,
  modalStore,
  route,
  router,
}) {
  const resourceStore = useResourceStore()
  const forumRealtimeStore = useForumRealtimeStore()
  const routeState = useDiscussionListRouteState({ route, router })
  const markingAllRead = ref(false)

  const currentTagSlug = computed(() => route.params.slug || null)
  const searchQuery = routeState.searchQuery
  const sortBy = routeState.sortBy
  const listFilter = routeState.listFilter
  const isFollowingPage = computed(() => route.name === 'following' || listFilter.value === 'following')
  const resourceState = useDiscussionListResourceState({
    currentTagSlug,
    isFollowingPage,
    listFilter,
    searchQuery,
    sortBy,
  })
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
  const loading = listState.loading
  const refreshing = listState.refreshing
  const loadingMore = listState.loadingMore

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

  const realtimeState = useDiscussionListRealtimeState({
    api,
    authStore,
    currentDiscussionIds: resourceState.discussionIds,
    forumRealtimeStore,
    markingAllRead,
    modalStore,
    refreshDiscussionList,
    resourceStore,
    uiText,
  })

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

  async function changeSortBy(sort) {
    if (sortBy.value === sort) return
    await routeState.push({
      sortBy: sort,
      listFilter: listFilter.value,
      searchQuery: searchQuery.value,
    })
  }

  async function changeListFilter(filterCode) {
    if (listFilter.value === filterCode) return
    await routeState.push({
      listFilter: filterCode,
      sortBy: sortBy.value,
      searchQuery: searchQuery.value,
    })
  }

  async function changeSearchQuery(nextQuery) {
    if (searchQuery.value === nextQuery) return
    await routeState.push({
      searchQuery: nextQuery,
      sortBy: sortBy.value,
      listFilter: listFilter.value,
    })
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
    changeSortBy,
    currentTag: resourceState.currentTag,
    currentTagSlug,
    discussions: resourceState.discussions,
    filterOptions: resourceState.filterOptions,
    hasMore: resourceState.hasMore,
    isFollowingPage,
    listFilter,
    loadMore,
    loading,
    loadingMore,
    markAllAsRead: realtimeState.markAllAsRead,
    changeListFilter,
    changeSearchQuery,
    markingAllRead,
    refreshPageData,
    refreshDiscussionList,
    refreshing,
    sortBy,
    sortOptions: resourceState.sortOptions,
    tags: resourceState.tags
  }
}
