import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useDiscussionDetailState } from '@/composables/useDiscussionDetailState'
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

  const previousTrigger = ref(null)
  const nextTrigger = ref(null)

  let scrollFrame = null

  onMounted(async () => {
    await refreshDiscussion()
    window.addEventListener('scroll', handlePostScroll, { passive: true })
    window.addEventListener('resize', handlePostScroll, { passive: true })
    attachGlobalListeners()
    await nextTick()
    updateVisiblePostFromScroll()
    syncMobileHeader()
  })

  onBeforeUnmount(() => {
    window.removeEventListener('scroll', handlePostScroll)
    window.removeEventListener('resize', handlePostScroll)
    detachGlobalListeners()
    if (scrollFrame) {
      cancelAnimationFrame(scrollFrame)
    }
  })

  watch(
    () => [route.params.id, route.query.near],
    async () => {
      resetMobileHeader()
      resetPostStream()
      resetTransientUiState()
      resetScrubberPreview()
      loading.value = true
      await refreshDiscussion()
    }
  )

  watch(
    () => [
      currentVisiblePostProgress.value,
      maxPostNumber.value,
      discussion.value?.title,
      hasMobileDiscussionMenuActions.value
    ],
    () => {
      syncMobileHeader()
    }
  )

  async function refreshDiscussion() {
    await detailState.refreshDiscussion({ keepLoading: true })
  }

  function handlePostScroll() {
    if (scrollFrame) return

    scrollFrame = requestAnimationFrame(() => {
      scrollFrame = null
      syncScrubberTrackMetrics()
      updateVisiblePostFromScroll()
      maybeAutoLoadPosts()
    })
  }

  function maybeAutoLoadPosts() {
    if (hasPrevious.value && !loadingPrevious.value && previousTrigger.value) {
      const previousRect = previousTrigger.value.getBoundingClientRect()
      if (previousRect.top <= 220) {
        loadPreviousPostsWithAnchor()
      }
    }

    if (hasMore.value && !loadingMore.value && nextTrigger.value) {
      const nextRect = nextTrigger.value.getBoundingClientRect()
      if (nextRect.top - window.innerHeight <= 280) {
        loadMorePostsAndSync()
      }
    }
  }

  async function loadMorePostsAndSync() {
    await loadMorePosts()
    await nextTick()
    syncScrubberTrackMetrics()
    updateVisiblePostFromScroll()
    maybeAutoLoadPosts()
  }

  async function loadPreviousPostsWithAnchor() {
    const anchorNumber = posts.value[0]?.number
    const anchorTop = anchorNumber ? document.getElementById(`post-${anchorNumber}`)?.getBoundingClientRect().top : null
    await loadPreviousPosts()
    await nextTick()
    if (anchorNumber && anchorTop !== null) {
      const newTop = document.getElementById(`post-${anchorNumber}`)?.getBoundingClientRect().top
      if (typeof newTop === 'number') {
        window.scrollBy({ top: newTop - anchorTop })
      }
    }
    syncScrubberTrackMetrics()
    updateVisiblePostFromScroll()
    maybeAutoLoadPosts()
  }

  function updateVisiblePostFromScroll() {
    if (!posts.value.length) return

    const anchorY = 120
    const viewportTop = 96
    const viewportBottom = window.innerHeight
    let closestPostNumber = posts.value[0].number
    let closestDistance = Number.POSITIVE_INFINITY
    let indexFromViewport = null
    let lastVisiblePostNumber = posts.value[0].number

    for (const post of posts.value) {
      const element = document.getElementById(`post-${post.number}`)
      if (!element) continue

      const rect = element.getBoundingClientRect()
      if (rect.bottom < viewportTop) continue
      if (rect.top > viewportBottom) break

      const height = rect.height || 1
      const visibleTop = Math.max(0, viewportTop - rect.top)
      const visibleBottom = Math.min(height, viewportBottom - rect.top)
      const visiblePart = visibleBottom - visibleTop

      if (indexFromViewport === null) {
        indexFromViewport = post.number + visibleTop / height
      }

      if (visiblePart > 0) {
        lastVisiblePostNumber = post.number
      }

      const distance = Math.abs(rect.top - anchorY)
      if (distance < closestDistance) {
        closestDistance = distance
        closestPostNumber = post.number
      }
    }

    const scrollBottom = window.scrollY + window.innerHeight
    const documentBottom = document.documentElement.scrollHeight
    const isAtPageBottom = documentBottom - scrollBottom <= 24
    const trackedPostNumber = isAtPageBottom ? lastVisiblePostNumber : closestPostNumber

    setCurrentVisiblePostProgress(
      isAtPageBottom
        ? maxPostNumber.value
        : clampPostPosition(indexFromViewport ?? trackedPostNumber)
    )

    if (trackedPostNumber !== currentVisiblePostNumber.value) {
      setCurrentVisiblePostNumber(trackedPostNumber)
      scheduleNearUrlSync(trackedPostNumber)
      scheduleReadStateSync(trackedPostNumber)
    }
  }

  function clampPostPosition(value) {
    const parsed = Number(value)
    if (!Number.isFinite(parsed)) return 1
    return Math.min(maxPostNumber.value, Math.max(1, parsed))
  }

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
