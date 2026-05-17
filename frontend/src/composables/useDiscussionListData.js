import { computed, ref } from 'vue'
import api from '@/api'
import { useDiscussionListLoadState } from '@/composables/useDiscussionListLoadState'
import { useDiscussionListPageLifecycle } from '@/composables/useDiscussionListPageLifecycle'
import { useDiscussionListRealtimeLifecycleState } from '@/composables/useDiscussionListRealtimeLifecycleState'
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
    markingAllRead,
    modalStore,
    refreshDiscussionList: loadState.refreshDiscussionList,
    resourceStore,
    uiText: loadState.uiText,
  })
  const realtimeLifecycleState = useDiscussionListRealtimeLifecycleState({
    discussionIds: resourceState.discussionIds,
    forumEventHandler: realtimeState.handleForumEvent,
    forumRealtimeStore,
    readStateHandler: realtimeState.handleDiscussionReadStateUpdated,
  })

  useDiscussionListPageLifecycle({
    addDiscussionReadStateListener: realtimeLifecycleState.addDiscussionReadStateListener,
    addForumEventListener: realtimeLifecycleState.addForumEventListener,
    cleanupTrackedDiscussionIds: realtimeLifecycleState.cleanupTrackedDiscussionIds,
    currentDiscussionIds: resourceState.discussionIds,
    removeDiscussionReadStateListener: realtimeLifecycleState.removeDiscussionReadStateListener,
    removeForumEventListener: realtimeLifecycleState.removeForumEventListener,
    syncTrackedDiscussionIds: realtimeLifecycleState.syncTrackedDiscussionIds,
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
    loading: loadState.listState.loading,
    loadingMore: loadState.listState.loadingMore,
    markAllAsRead: realtimeState.markAllAsRead,
    changeListFilter: routeActions.changeListFilter,
    changeSearchQuery: routeActions.changeSearchQuery,
    markingAllRead,
    refreshPageData: loadState.refreshPageData,
    refreshDiscussionList: loadState.refreshDiscussionList,
    refreshing: loadState.listState.refreshing,
    searchQuery,
    sortBy,
    sortOptions: resourceState.sortOptions,
    tags: resourceState.tags,
  }
}
