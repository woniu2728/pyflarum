import { computed, ref } from 'vue'
import api from '@/api'
import { useDiscussionListLoadState } from '@/composables/useDiscussionListLoadState'
import { useDiscussionListResourceState } from '@/composables/useDiscussionListResourceState'
import { useDiscussionListRouteState } from '@/composables/useDiscussionListRouteState'
import { useDiscussionListRealtimeState } from '@/composables/useDiscussionListRealtimeState'
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
  const loadState = useDiscussionListLoadState({
    modalStore,
    resourceState,
    route,
    searchQuery,
    sortBy,
    listFilter,
  })

  const realtimeState = useDiscussionListRealtimeState({
    api,
    authStore,
    currentDiscussionIds: resourceState.discussionIds,
    forumRealtimeStore,
    markingAllRead,
    modalStore,
    refreshDiscussionList: loadState.refreshDiscussionList,
    resourceStore,
    uiText: loadState.uiText,
  })

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

  return {
    changeSortBy,
    currentTag: resourceState.currentTag,
    currentTagSlug,
    discussions: resourceState.discussions,
    filterOptions: resourceState.filterOptions,
    hasMore: resourceState.hasMore,
    isFollowingPage,
    listFilter,
    loadMore: loadState.loadMore,
    loading: loadState.loading,
    loadingMore: loadState.loadingMore,
    markAllAsRead: realtimeState.markAllAsRead,
    changeListFilter,
    changeSearchQuery,
    markingAllRead,
    refreshPageData: loadState.refreshPageData,
    refreshDiscussionList: loadState.refreshDiscussionList,
    refreshing: loadState.refreshing,
    sortBy,
    sortOptions: resourceState.sortOptions,
    tags: resourceState.tags
  }
}
