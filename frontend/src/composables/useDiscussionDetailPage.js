import { computed } from 'vue'
import { useDiscussionDetailPageLifecycle } from '@/composables/useDiscussionDetailPageLifecycle'
import { useDiscussionDetailState } from '@/composables/useDiscussionDetailState'
import { useDiscussionPostViewportState } from '@/composables/useDiscussionPostViewportState'
import { useDiscussionSidebarScrubber } from '@/composables/useDiscussionSidebarScrubber'
import { useDiscussionDetailUiState } from '@/composables/useDiscussionDetailUiState'

export function useDiscussionDetailPage({
  authStore,
  composerStore,
  route,
  router
}) {
  const detailState = useDiscussionDetailState({
    authStore,
    route,
    router,
  })
  const discussion = detailState.discussion
  const {
    currentVisiblePostNumber,
    currentVisiblePostProgress,
    hasMore,
    hasPrevious,
    highlightedPostNumber,
    jumpToPost,
    loadMorePosts,
    loading,
    loadingMore,
    loadingPrevious,
    loadPreviousPosts,
    maxPostNumber,
    posts,
    removePost,
    resetPostStream,
    scheduleNearUrlSync,
    scheduleReadStateSync,
    scrollToPost,
    syncWindowToRouteNear,
    setCurrentVisiblePostNumber,
    setCurrentVisiblePostProgress,
    showUnreadDivider,
    totalPosts,
    unreadCount,
    unreadStartPostNumber,
    upsertPost,
  } = detailState.postStream
  const isSuspended = computed(() => Boolean(authStore.user?.is_suspended))
  const uiState = useDiscussionDetailUiState({
    authStore,
    composerStore,
    currentVisiblePostProgress,
    discussion,
    isSuspended,
    maxPostNumber,
  })
  const {
    activePostMenuId,
    attachGlobalListeners,
    closePostMenu,
    detachGlobalListeners,
    discussionMobileNavRef,
    hasActiveComposer,
    hasMobileDiscussionMenuActions,
    resetMobileHeader,
    resetTransientUiState,
    showDiscussionMenu,
    syncMobileHeader,
    toggleDiscussionMenu,
    togglePostMenu,
  } = uiState
  const scrubberState = useDiscussionSidebarScrubber({
    currentVisiblePostNumber,
    currentVisiblePostProgress,
    jumpToPost,
    maxPostNumber,
    posts,
    unreadCount,
    unreadStartPostNumber,
  })
  const {
    discussionSidebarRef,
    handleScrubberMouseDown,
    handleScrubberTrackClick,
    resetScrubberPreview,
    scrubberAfterPercent,
    scrubberBeforePercent,
    scrubberDescription,
    scrubberDragging,
    scrubberHandlePercent,
    scrubberPositionText,
    scrubberScrollbarStyle,
    syncScrubberTrackMetrics,
    unreadHeightPercent,
    unreadTopPercent,
  } = scrubberState
  const viewportState = useDiscussionPostViewportState({
    currentVisiblePostNumber,
    hasMore,
    hasPrevious,
    loadingMore,
    loadingPrevious,
    loadMorePosts,
    loadPreviousPosts,
    maxPostNumber,
    posts,
    scheduleNearUrlSync,
    scheduleReadStateSync,
    setCurrentVisiblePostNumber,
    setCurrentVisiblePostProgress,
    syncScrubberTrackMetrics,
  })
  const {
    loadMorePostsAndSync,
    loadPreviousPostsWithAnchor,
    nextTrigger,
    previousTrigger,
    updateVisiblePostFromScroll,
  } = viewportState

  async function refreshDiscussion() {
    await detailState.refreshDiscussion({ keepLoading: true })
  }

  useDiscussionDetailPageLifecycle({
    attachGlobalListeners,
    currentVisiblePostProgress,
    detachGlobalListeners,
    discussionTitle: computed(() => discussion.value?.title || ''),
    hasMobileDiscussionMenuActions,
    loading,
    maxPostNumber,
    refreshDiscussion,
    resetMobileHeader,
    resetPostStream,
    resetScrubberPreview,
    resetTransientUiState,
    route,
    syncNearPostWindow: syncWindowToRouteNear,
    syncMobileHeader,
    updateVisiblePostFromScroll,
  })

  return {
    activePostMenuId,
    closePostMenu,
    discussion,
    discussionMobileNavRef,
    discussionSidebarRef,
    hasActiveComposer,
    hasMore,
    hasPrevious,
    handleScrubberMouseDown,
    handleScrubberTrackClick,
    highlightedPostNumber,
    jumpToPost,
    loadMorePosts: loadMorePostsAndSync,
    loading,
    loadingMore,
    loadingPrevious,
    loadPreviousPosts: loadPreviousPostsWithAnchor,
    maxPostNumber,
    nextTrigger,
    patchDiscussion: detailState.patchDiscussion,
    posts,
    previousTrigger,
    refreshDiscussion,
    removePost,
    scrollToPost,
    scrubberAfterPercent,
    scrubberBeforePercent,
    scrubberDescription,
    scrubberDragging,
    scrubberHandlePercent,
    scrubberPositionText,
    scrubberScrollbarStyle,
    showDiscussionMenu,
    showUnreadDivider,
    toggleDiscussionMenu,
    togglePostMenu,
    totalPosts,
    unreadCount,
    unreadHeightPercent,
    unreadTopPercent,
    upsertPost,
  }
}
