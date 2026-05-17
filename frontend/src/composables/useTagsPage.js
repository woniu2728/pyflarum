import { useTagsLoadState } from '@/composables/useTagsLoadState'
import { useTagsPageLifecycle } from '@/composables/useTagsPageLifecycle'
import { useTagsRealtimeState } from '@/composables/useTagsRealtimeState'
import { useTagsResourceState } from '@/composables/useTagsResourceState'
import { useForumRealtimeStore } from '@/stores/forumRealtime'
import { useResourceStore } from '@/stores/resource'

export function useTagsPage() {
  const forumRealtimeStore = useForumRealtimeStore()
  const resourceStore = useResourceStore()
  const resourceState = useTagsResourceState({
    resourceStore,
  })
  const loadState = useTagsLoadState({
    resourceState,
  })
  const realtimeState = useTagsRealtimeState({
    loadTags: loadState.loadTags,
    resourceStore,
    trackedDiscussionIds: resourceState.trackedDiscussionIds,
  })

  function addForumEventListener(handler) {
    if (typeof window === 'undefined') return
    window.addEventListener('bias:forum-event', handler)
  }

  function removeForumEventListener(handler) {
    if (typeof window === 'undefined') return
    window.removeEventListener('bias:forum-event', handler)
  }

  function cleanupTrackedDiscussionIds() {
    forumRealtimeStore.untrackDiscussionIds(resourceState.trackedDiscussionIds.value)
  }

  function syncTrackedDiscussionIds(nextTrackedIds, previousTrackedIds = []) {
    forumRealtimeStore.untrackDiscussionIds(previousTrackedIds)
    forumRealtimeStore.trackDiscussionIds(nextTrackedIds)
  }

  useTagsPageLifecycle({
    addForumEventListener,
    cleanupTrackedDiscussionIds,
    forumEventHandler: realtimeState.handleForumEvent,
    loadInitialTags: loadState.loadInitialTags,
    removeForumEventListener,
    syncTrackedDiscussionIds,
    trackedDiscussionIds: resourceState.trackedDiscussionIds,
  })

  return {
    cloudTags: resourceState.cloudTags,
    loading: loadState.listState.loading,
    tags: resourceState.tags,
  }
}
