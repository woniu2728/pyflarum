import { onBeforeUnmount, onMounted, watch } from 'vue'

export function createSearchResultsPageLifecycle({
  abortActiveRequest,
  addForumEventListener,
  cleanupTrackedDiscussionIds,
  removeForumEventListener,
  syncTrackedDiscussionIds,
}) {
  function handleTrackedDiscussionIdsChange(nextTrackedIds, previousTrackedIds = []) {
    syncTrackedDiscussionIds(nextTrackedIds, previousTrackedIds)
  }

  function handleMounted() {
    addForumEventListener()
  }

  function handleBeforeUnmount() {
    abortActiveRequest()
    cleanupTrackedDiscussionIds()
    removeForumEventListener()
  }

  return {
    handleBeforeUnmount,
    handleMounted,
    handleTrackedDiscussionIdsChange,
  }
}

export function useSearchResultsPageLifecycle({
  abortActiveRequest,
  addForumEventListener,
  cleanupTrackedDiscussionIds,
  removeForumEventListener,
  syncTrackedDiscussionIds,
  trackedDiscussionIds,
}) {
  const lifecycle = createSearchResultsPageLifecycle({
    abortActiveRequest,
    addForumEventListener,
    cleanupTrackedDiscussionIds,
    removeForumEventListener,
    syncTrackedDiscussionIds,
  })

  watch(
    () => trackedDiscussionIds.value,
    lifecycle.handleTrackedDiscussionIdsChange
  )

  onMounted(lifecycle.handleMounted)
  onBeforeUnmount(lifecycle.handleBeforeUnmount)

  return lifecycle
}
