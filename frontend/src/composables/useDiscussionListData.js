import { computed, ref } from 'vue'
import api from '@/api'
import { useDiscussionListLoadState } from '@/composables/useDiscussionListLoadState'
import { useDiscussionListRouteActions } from '@/composables/useDiscussionListRouteActions'
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
  const routeActions = useDiscussionListRouteActions({
    routeState,
    listFilter,
    searchQuery,
    sortBy,
  })

  return {
    changeSortBy: routeActions.changeSortBy,
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
    changeListFilter: routeActions.changeListFilter,
    changeSearchQuery: routeActions.changeSearchQuery,
    markingAllRead,
    refreshPageData: loadState.refreshPageData,
    refreshDiscussionList: loadState.refreshDiscussionList,
    refreshing: loadState.refreshing,
    sortBy,
    sortOptions: resourceState.sortOptions,
    tags: resourceState.tags
  }
}
