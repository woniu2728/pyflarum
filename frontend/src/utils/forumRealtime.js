export const FORUM_REALTIME_REFRESH_EVENT_TYPES = new Set([
  'discussion.hidden',
  'discussion.rejected',
  'discussion.resubmitted',
  'post.hidden',
  'post.rejected',
  'post.resubmitted',
])

export function getTrackedDiscussionIdsFromDiscussionItems(items = []) {
  return items
    .map(item => Number(item?.id))
    .filter(value => Number.isInteger(value) && value > 0)
}

export function getTrackedDiscussionIdsFromPostItems(items = []) {
  return items
    .map(item => Number(item?.discussion_id || item?.discussion?.id))
    .filter(value => Number.isInteger(value) && value > 0)
}

export function hasTrackedDiscussionId(targetIds, discussionId) {
  if (!discussionId) return false
  const trackedIds = new Set((targetIds || []).map(value => String(value)))
  return trackedIds.has(String(discussionId))
}

export function shouldRefreshForumEvent(eventType) {
  return FORUM_REALTIME_REFRESH_EVENT_TYPES.has(String(eventType || ''))
}

export function mergeForumEventPayload(resourceStore, event) {
  if (!resourceStore || !event || typeof event !== 'object') {
    return
  }

  resourceStore.mergePayload(event.payload || {})
}
