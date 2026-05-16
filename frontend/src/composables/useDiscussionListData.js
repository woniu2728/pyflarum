import { computed, ref } from 'vue'
import api from '@/api'
import { getUiCopy } from '@/forum/registry'
import { useDiscussionListRouteState } from '@/composables/useDiscussionListRouteState'
import { useDiscussionListRealtimeState } from '@/composables/useDiscussionListRealtimeState'
import { usePaginatedListState } from '@/composables/usePaginatedListState'
import { useForumRealtimeStore } from '@/stores/forumRealtime'
import { useResourceStore } from '@/stores/resource'
import { normalizeDiscussion, normalizeTag, unwrapList } from '@/utils/forum'

export function useDiscussionListData({
  authStore,
  modalStore,
  route,
  router,
}) {
  const resourceStore = useResourceStore()
  const forumRealtimeStore = useForumRealtimeStore()
  const routeState = useDiscussionListRouteState({ route, router })
  const discussionIds = ref([])
  const tagIds = ref([])
  const currentTagId = ref(null)
  const discussions = computed(() => resourceStore.list('discussions', discussionIds.value))
  const tags = computed(() => resourceStore.list('tags', tagIds.value))
  const currentTag = computed(() => (currentTagId.value ? resourceStore.get('tags', currentTagId.value) : null))
  const sortOptions = ref([])
  const filterOptions = ref([])
  const currentPage = ref(1)
  const total = ref(0)
  const markingAllRead = ref(false)
  const pageSize = 20

  const currentTagSlug = computed(() => route.params.slug || null)
  const searchQuery = routeState.searchQuery
  const sortBy = routeState.sortBy
  const listFilter = routeState.listFilter
  const hasMore = computed(() => currentPage.value * pageSize < total.value)
  const isFollowingPage = computed(() => route.name === 'following' || listFilter.value === 'following')
  const listState = usePaginatedListState({
    watchSources: () => [route.name, route.params.slug, searchQuery.value, sortBy.value, listFilter.value],
    initialLoading: true,
    reset() {
      discussionIds.value = []
      currentTagId.value = null
      currentPage.value = 1
      total.value = 0
    },
    async load({ mode }) {
      if (mode === 'initial') {
        await Promise.all([loadTags(), loadCurrentTag(), loadDiscussions(false)])
        return null
      }

      if (mode === 'append') {
        currentPage.value += 1
        try {
          await loadDiscussions(true)
        } catch (error) {
          currentPage.value = Math.max(1, currentPage.value - 1)
          throw error
        }
        return null
      }

      await loadDiscussions(false)
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
    currentDiscussionIds: discussionIds,
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
      discussionIds.value = []
      currentTagId.value = null
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

  async function loadTags() {
    const response = await api.get('/tags', {
      params: {
        include_children: true
      }
    })
    tagIds.value = unwrapList(response)
      .map(normalizeTag)
      .map(item => resourceStore.upsert('tags', item).id)
  }

  async function loadCurrentTag() {
    if (!currentTagSlug.value || isFollowingPage.value) {
      currentTagId.value = null
      return
    }

    try {
      const response = await api.get(`/tags/slug/${currentTagSlug.value}`)
      const tag = resourceStore.upsert('tags', normalizeTag(response))
      currentTagId.value = tag.id
    } catch (error) {
      currentTagId.value = null
      console.error('加载标签详情失败:', error)
    }
  }

  async function loadDiscussions(append) {
    const response = await api.get('/discussions/', {
      params: {
        page: currentPage.value,
        limit: pageSize,
        sort: sortBy.value,
        filter: listFilter.value,
        q: searchQuery.value || undefined,
        tag: currentTagSlug.value || undefined,
      }
    })

    const items = unwrapList(response).map(normalizeDiscussion)
    const ids = items.map(item => resourceStore.upsert('discussions', item).id)

    if (append) {
      discussionIds.value = [...discussionIds.value, ...ids]
    } else {
      discussionIds.value = ids
    }

    total.value = response.total || items.length
    sortOptions.value = Array.isArray(response.available_sorts) ? response.available_sorts : []
    filterOptions.value = Array.isArray(response.available_filters) ? response.available_filters : []
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
    currentTag,
    currentTagSlug,
    discussions,
    filterOptions,
    hasMore,
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
    sortOptions,
    tags
  }
}
