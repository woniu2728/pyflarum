import {
  FORUM_REALTIME_REFRESH_EVENT_TYPES,
  hasTrackedDiscussionId as resolveTrackedDiscussionId,
  shouldRefreshForumEvent,
} from '../utils/forumRealtime.js'

export function createSearchResultsRealtimeState({
  hasTrackedDiscussionId = resolveTrackedDiscussionId,
  loadResults,
  mergePayload,
  shouldRefreshEvent = shouldRefreshForumEvent,
  trackedDiscussionIds,
}) {
  async function handleForumEvent(event) {
    const detail = event.detail || {}
    const discussionId = Number(detail.discussion_id)
    if (!hasTrackedDiscussionId(trackedDiscussionIds(), discussionId)) {
      return
    }

    if (shouldRefreshEvent(detail.event_type)) {
      await loadResults()
      return
    }

    mergePayload(detail.payload || {})
  }

  return {
    handleForumEvent,
  }
}

export function useSearchResultsRealtimeState({
  loadResults,
  resourceStore,
  trackedDiscussionIds,
}) {
  return createSearchResultsRealtimeState({
    hasTrackedDiscussionId: resolveTrackedDiscussionId,
    loadResults,
    mergePayload(payload) {
      resourceStore.mergePayload(payload)
    },
    shouldRefreshEvent(eventType) {
      return FORUM_REALTIME_REFRESH_EVENT_TYPES.has(String(eventType || ''))
    },
    trackedDiscussionIds: () => trackedDiscussionIds.value,
  })
}
