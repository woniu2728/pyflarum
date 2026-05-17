import { onBeforeUnmount, onMounted, watch } from 'vue'

export function createDiscussionListPageLifecycle({
  addDiscussionReadStateListener,
  addForumEventListener,
  cleanupTrackedDiscussionIds,
  removeDiscussionReadStateListener,
  removeForumEventListener,
  syncTrackedDiscussionIds,
}) {
  function handleCurrentDiscussionIdsChange(nextDiscussionIds, previousDiscussionIds = []) {
    syncTrackedDiscussionIds(nextDiscussionIds, previousDiscussionIds)
  }

  function handleMounted() {
    addDiscussionReadStateListener()
    addForumEventListener()
  }

  function handleBeforeUnmount() {
    cleanupTrackedDiscussionIds()
    removeDiscussionReadStateListener()
    removeForumEventListener()
  }

  return {
    handleBeforeUnmount,
    handleCurrentDiscussionIdsChange,
    handleMounted,
  }
}

export function useDiscussionListPageLifecycle({
  addDiscussionReadStateListener,
  addForumEventListener,
  cleanupTrackedDiscussionIds,
  currentDiscussionIds,
  removeDiscussionReadStateListener,
  removeForumEventListener,
  syncTrackedDiscussionIds,
}) {
  const lifecycle = createDiscussionListPageLifecycle({
    addDiscussionReadStateListener,
    addForumEventListener,
    cleanupTrackedDiscussionIds,
    removeDiscussionReadStateListener,
    removeForumEventListener,
    syncTrackedDiscussionIds,
  })

  watch(
    () => currentDiscussionIds.value,
    lifecycle.handleCurrentDiscussionIdsChange,
    { immediate: true }
  )

  onMounted(lifecycle.handleMounted)
  onBeforeUnmount(lifecycle.handleBeforeUnmount)

  return lifecycle
}
