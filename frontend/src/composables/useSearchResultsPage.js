import { computed, ref } from 'vue'
import api from '@/api'
import { usePaginatedListState } from '@/composables/usePaginatedListState'
import { useRoutePagination } from '@/composables/useRoutePagination'
import { useSearchFilterCatalog } from '@/composables/useSearchFilterCatalog'
import { useSearchResultsPageLifecycle } from '@/composables/useSearchResultsPageLifecycle'
import { useSearchResultsRealtimeState } from '@/composables/useSearchResultsRealtimeState'
import { useSearchResultsRouteActions } from '@/composables/useSearchResultsRouteActions'
import { useSearchRouteState } from '@/composables/useSearchRouteState'
import { getEmptyState, getSearchSources, getStateBlock, getUiCopy } from '@/forum/registry'
import { useForumRealtimeStore } from '@/stores/forumRealtime'
import { useResourceStore } from '@/stores/resource'
import {
  getTrackedDiscussionIdsFromDiscussionItems,
  getTrackedDiscussionIdsFromPostItems,
} from '@/utils/forumRealtime'
import { unwrapList } from '@/utils/forum'

export function useSearchResultsPage({ route, router }) {
  const routeState = useSearchRouteState({ route, router })
  const resourceStore = useResourceStore()
  const forumRealtimeStore = useForumRealtimeStore()
  const searchSources = getSearchSources()
  const sourceMap = Object.fromEntries(searchSources.map(item => [item.routeType || item.type, item]))
  const total = ref(0)
  const discussionTotal = ref(0)
  const postTotal = ref(0)
  const userTotal = ref(0)
  const discussionIds = ref([])
  const postIds = ref([])
  const userIds = ref([])
  let activeController = null
  let activeRequestId = 0
  const discussions = computed(() => resourceStore.list('discussions', discussionIds.value))
  const posts = computed(() => resourceStore.list('posts', postIds.value))
  const users = computed(() => resourceStore.list('users', userIds.value))
  const normalizedQuery = routeState.normalizedQuery
  const searchType = routeState.searchType
  const activeSource = computed(() => sourceMap[searchType.value] || null)
  const searchFilterTarget = computed(() => {
    return activeSource.value?.filterTarget || (searchType.value === 'all' ? 'discussion' : '')
  })
  const searchFilterCatalog = useSearchFilterCatalog(searchFilterTarget)
  const page = routeState.page
  const routePagination = useRoutePagination({
    page,
    push: routeState.push,
  })
  const totalPages = computed(() => Math.max(1, Math.ceil(total.value / 20)))
  const isEmpty = computed(() => !discussions.value.length && !posts.value.length && !users.value.length)
  const trackedDiscussionIds = computed(() => [
    ...getTrackedDiscussionIdsFromDiscussionItems(discussions.value),
    ...getTrackedDiscussionIdsFromPostItems(posts.value),
  ])
  const emptyStateText = computed(() => {
    const emptyState = getEmptyState({
      surface: 'search-page-empty',
      hasQuery: Boolean(normalizedQuery.value),
      searchType: searchType.value,
    })

    return emptyState?.text || '没有找到相关讨论、帖子或用户。'
  })
  const idleStateText = computed(() => {
    const emptyState = getEmptyState({
      surface: 'search-page-idle',
      hasQuery: Boolean(normalizedQuery.value),
      searchType: searchType.value,
    })

    return emptyState?.text || '请输入关键词后再搜索。'
  })
  const loadingStateText = computed(() => {
    const stateBlock = getStateBlock({
      surface: 'search-page-loading',
      loading: loading.value,
      hasQuery: Boolean(normalizedQuery.value),
      searchType: searchType.value,
    })

    return stateBlock?.text || '搜索中...'
  })
  const showDiscussions = computed(() => searchType.value === 'all' || searchType.value === 'discussions')
  const showPosts = computed(() => searchType.value === 'all' || searchType.value === 'posts')
  const showUsers = computed(() => searchType.value === 'all' || searchType.value === 'users')
  const listState = usePaginatedListState({
    watchSources: () => [normalizedQuery.value, searchType.value, page.value],
    initialLoading: false,
    reset: resetResults,
    async load() {
      if (!normalizedQuery.value) {
        activeController?.abort()
        resetResults()
        return null
      }

      activeController?.abort()
      const requestId = activeRequestId + 1
      activeRequestId = requestId
      const controller = new AbortController()
      activeController = controller

      try {
        const data = await api.get('/search', {
          params: {
            q: normalizedQuery.value,
            type: activeSource.value?.apiType || searchType.value,
            page: page.value,
            limit: 20
          },
          signal: controller.signal
        })

        if (requestId !== activeRequestId) {
          return null
        }

        total.value = data.total || 0
        discussionTotal.value = data.discussion_total ?? (data.discussions || []).length
        postTotal.value = data.post_total ?? (data.posts || []).length
        userTotal.value = data.user_total ?? (data.users || []).length
        discussionIds.value = resourceStore.upsertMany('discussions', unwrapList(data.discussions || []))
          .map(item => item.id)
        postIds.value = resourceStore.upsertMany('posts', unwrapList(data.posts || []))
          .map(item => item.id)
        userIds.value = resourceStore.upsertMany('users', unwrapList(data.users || []))
          .map(item => item.id)
        searchFilterCatalog.loadError.value = ''
        return data
      } catch (error) {
        if (isCanceledRequest(error)) {
          return null
        }
        throw error
      } finally {
        if (requestId === activeRequestId) {
          activeController = null
        }
      }
    },
  })
  const loading = listState.loading

  function getSearchUiCopy(surface, context = {}, fallback = '') {
    return getUiCopy({
      surface,
      ...context,
    })?.text || fallback
  }

  const filterItems = computed(() => {
    const counts = {
      discussions: discussionTotal.value,
      posts: postTotal.value,
      users: userTotal.value,
    }

    return [
      {
        value: 'all',
        label: getUiCopy({
          surface: 'search-filter-all-label',
          count: discussionTotal.value + postTotal.value + userTotal.value,
        })?.text || '全部',
        count: getSearchUiCopy(
          'search-results-total-count',
          { count: discussionTotal.value + postTotal.value + userTotal.value },
          String(discussionTotal.value + postTotal.value + userTotal.value)
        )
      },
      ...searchSources.map(item => ({
        value: item.routeType || item.type,
        label: item.label,
        count: getSearchUiCopy(
          'search-results-source-count',
          {
            count: Number(counts[item.routeType || item.type] || 0),
            type: item.routeType || item.type,
          },
          String(Number(counts[item.routeType || item.type] || 0))
        ),
      })),
    ]
  })
  const heroText = computed(() => {
    const uiCopy = getUiCopy({
      surface: 'search-page-hero-description',
      hasQuery: Boolean(normalizedQuery.value),
      searchType: searchType.value,
      total: total.value,
      discussionTotal: discussionTotal.value,
      postTotal: postTotal.value,
      userTotal: userTotal.value,
      activeLabel: activeSource.value?.label || '结果',
    })
    if (uiCopy?.text) {
      return uiCopy.text
    }

    if (!normalizedQuery.value) {
      return '支持在讨论、帖子和用户之间进行全局搜索。'
    }

    if (searchType.value === 'all') {
      return `共找到 ${discussionTotal.value + postTotal.value + userTotal.value} 条结果，已按讨论、帖子和用户分组展示。`
    }

    const label = activeSource.value?.label || '结果'
    return `当前显示 ${label}结果，共 ${total.value} 条。`
  })
  const syntaxItems = computed(() => {
    if (!searchFilterTarget.value) {
      return []
    }
    return searchFilterCatalog.filterSuggestions.value
  })
  const searchSourceSections = computed(() => {
    const sourceItems = {
      discussions: discussions.value,
      posts: posts.value,
      users: users.value,
    }
    const sourceTotals = {
      discussions: discussionTotal.value,
      posts: postTotal.value,
      users: userTotal.value,
    }

    return searchSources.map(source => {
      const sourceKey = source.routeType || source.type
      const items = sourceItems[sourceKey] || []
      const totalForSource = Number(sourceTotals[sourceKey] || 0)
      const resultItems = typeof source.buildResultItems === 'function'
        ? source.buildResultItems(items, { query: normalizedQuery.value })
        : []

      return {
        ...source,
        key: sourceKey,
        resultItems,
        showMore: searchType.value === 'all' && totalForSource > items.length,
        visible: searchType.value === 'all' || searchType.value === sourceKey,
      }
    })
  })

  function abortActiveRequest() {
    activeController?.abort()
  }

  function addForumEventListener() {
    if (typeof window === 'undefined') return
    window.addEventListener('bias:forum-event', realtimeState.handleForumEvent)
  }

  function removeForumEventListener() {
    if (typeof window === 'undefined') return
    window.removeEventListener('bias:forum-event', realtimeState.handleForumEvent)
  }

  function cleanupTrackedDiscussionIds() {
    forumRealtimeStore.untrackDiscussionIds(trackedDiscussionIds.value)
  }

  function syncTrackedDiscussionIds(nextTrackedIds, previousTrackedIds = []) {
    forumRealtimeStore.untrackDiscussionIds(previousTrackedIds)
    forumRealtimeStore.trackDiscussionIds(nextTrackedIds)
  }

  async function loadResults() {
    try {
      await listState.refresh({
        mode: 'initial',
        forceLoading: Boolean(normalizedQuery.value),
      })
    } catch (error) {
      console.error('加载搜索结果失败:', error)
      searchFilterCatalog.loadError.value = error.response?.data?.error
        || error.response?.data?.detail
        || error.message
        || getSearchUiCopy('search-results-load-error', {}, '加载搜索结果失败，请稍后重试')
      resetResults()
    }
  }

  function resetResults() {
    total.value = 0
    discussionTotal.value = 0
    postTotal.value = 0
    userTotal.value = 0
    discussionIds.value = []
    postIds.value = []
    userIds.value = []
  }

  const realtimeState = useSearchResultsRealtimeState({
    loadResults,
    resourceStore,
    trackedDiscussionIds,
  })
  const routeActions = useSearchResultsRouteActions({
    appendFilter: searchFilterCatalog.appendFilter,
    normalizedQuery,
    routePagination,
    searchSources,
    searchType,
  })

  useSearchResultsPageLifecycle({
    abortActiveRequest,
    addForumEventListener,
    cleanupTrackedDiscussionIds,
    forumEventHandler: realtimeState.handleForumEvent,
    removeForumEventListener,
    syncTrackedDiscussionIds,
    trackedDiscussionIds,
  })

  function isCanceledRequest(error) {
    return error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError'
  }

  return {
    changePage: routeActions.changePage,
    changeType: routeActions.changeType,
    discussionTotal,
    discussions,
    emptyStateText,
    filterItems,
    filterCatalogLoadError: searchFilterCatalog.loadError,
    applySyntax: routeActions.applySyntax,
    heroText,
    idleStateText,
    loadingStateText,
    isEmpty,
    loading,
    normalizedQuery,
    page,
    postTotal,
    posts,
    searchType,
    showDiscussions,
    showPosts,
    showUsers,
    searchSourceSections,
    syntaxItems,
    total,
    totalPages,
    userTotal,
    users
  }
}
