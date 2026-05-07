import { computed, onBeforeUnmount, ref, watch } from 'vue'
import api from '@/api'
import { useSearchFilterCatalog } from '@/composables/useSearchFilterCatalog'
import { useSearchRouteState } from '@/composables/useSearchRouteState'
import { getSearchSources } from '@/forum/registry'
import { useResourceStore } from '@/stores/resource'
import { unwrapList } from '@/utils/forum'

export function useSearchResultsPage({ route, router }) {
  const routeState = useSearchRouteState({ route, router })
  const resourceStore = useResourceStore()
  const searchSources = getSearchSources()
  const sourceMap = Object.fromEntries(searchSources.map(item => [item.routeType || item.type, item]))
  const loading = ref(false)
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
  const totalPages = computed(() => Math.max(1, Math.ceil(total.value / 20)))
  const isEmpty = computed(() => !discussions.value.length && !posts.value.length && !users.value.length)
  const showDiscussions = computed(() => searchType.value === 'all' || searchType.value === 'discussions')
  const showPosts = computed(() => searchType.value === 'all' || searchType.value === 'posts')
  const showUsers = computed(() => searchType.value === 'all' || searchType.value === 'users')
  const filterItems = computed(() => {
    const counts = {
      discussions: discussionTotal.value,
      posts: postTotal.value,
      users: userTotal.value,
    }

    return [
      { value: 'all', label: '全部', count: discussionTotal.value + postTotal.value + userTotal.value },
      ...searchSources.map(item => ({
        value: item.routeType || item.type,
        label: item.label,
        count: Number(counts[item.routeType || item.type] || 0),
      })),
    ]
  })
  const heroText = computed(() => {
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

  watch(
    () => [normalizedQuery.value, searchType.value, page.value],
    async () => {
      await loadResults()
    },
    { immediate: true }
  )

  onBeforeUnmount(() => {
    activeController?.abort()
  })

  async function loadResults() {
    if (!normalizedQuery.value) {
      activeController?.abort()
      resetResults()
      return
    }

    activeController?.abort()
    const requestId = activeRequestId + 1
    activeRequestId = requestId
    const controller = new AbortController()
    activeController = controller
    loading.value = true
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
        return
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
    } catch (error) {
      if (isCanceledRequest(error)) {
        return
      }
      console.error('加载搜索结果失败:', error)
      resetResults()
    } finally {
      if (requestId === activeRequestId) {
        loading.value = false
        activeController = null
      }
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

  function changeType(type) {
    const nextType = ['all', ...searchSources.map(item => item.routeType || item.type)].includes(type) ? type : 'all'
    if (nextType === searchType.value) {
      return
    }

    routeState.push({
      searchType: nextType,
      page: 1,
    })
  }

  function changePage(nextPage) {
    if (nextPage === page.value) {
      return
    }

    routeState.push({
      page: nextPage,
    })
  }

  function applySyntax(syntax) {
    const nextQuery = searchFilterCatalog.appendFilter(normalizedQuery.value, syntax)
    if (nextQuery === normalizedQuery.value) {
      return
    }

    routeState.push({
      normalizedQuery: nextQuery,
      page: 1,
    })
  }

  function isCanceledRequest(error) {
    return error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError'
  }

  return {
    changePage,
    changeType,
    discussionTotal,
    discussions,
    filterItems,
    applySyntax,
    heroText,
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
