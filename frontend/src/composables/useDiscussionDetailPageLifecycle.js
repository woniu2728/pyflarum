import { onBeforeUnmount, onMounted, watch } from 'vue'

export function createDiscussionDetailPageLifecycle({
  attachGlobalListeners,
  detachGlobalListeners,
  loading,
  refreshDiscussion,
  resetMobileHeader,
  resetPostStream,
  resetScrubberPreview,
  resetTransientUiState,
  syncMobileHeader,
  updateVisiblePostFromScroll,
}) {
  async function handleRouteScopeChange() {
    resetMobileHeader()
    resetPostStream()
    resetTransientUiState()
    resetScrubberPreview()
    loading.value = true
    await refreshDiscussion()
  }

  function handleHeaderSync() {
    syncMobileHeader()
  }

  async function handleMounted() {
    await refreshDiscussion()
    attachGlobalListeners()
    updateVisiblePostFromScroll()
    syncMobileHeader()
  }

  function handleBeforeUnmount() {
    detachGlobalListeners()
  }

  return {
    handleBeforeUnmount,
    handleHeaderSync,
    handleMounted,
    handleRouteScopeChange,
  }
}

export function useDiscussionDetailPageLifecycle({
  attachGlobalListeners,
  currentVisiblePostProgress,
  detachGlobalListeners,
  discussionTitle,
  hasMobileDiscussionMenuActions,
  loading,
  maxPostNumber,
  refreshDiscussion,
  resetMobileHeader,
  resetPostStream,
  resetScrubberPreview,
  resetTransientUiState,
  route,
  syncMobileHeader,
  updateVisiblePostFromScroll,
}) {
  const lifecycle = createDiscussionDetailPageLifecycle({
    attachGlobalListeners,
    detachGlobalListeners,
    loading,
    refreshDiscussion,
    resetMobileHeader,
    resetPostStream,
    resetScrubberPreview,
    resetTransientUiState,
    syncMobileHeader,
    updateVisiblePostFromScroll,
  })

  watch(
    () => [route.params.id, route.query.near],
    lifecycle.handleRouteScopeChange
  )

  watch(
    () => [
      currentVisiblePostProgress.value,
      maxPostNumber.value,
      discussionTitle.value,
      hasMobileDiscussionMenuActions.value,
    ],
    lifecycle.handleHeaderSync
  )

  onMounted(lifecycle.handleMounted)
  onBeforeUnmount(lifecycle.handleBeforeUnmount)

  return lifecycle
}
