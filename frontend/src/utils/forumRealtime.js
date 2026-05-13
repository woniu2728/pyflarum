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

export function applyDiscussionResourceAssociations(resourceStore, discussionPayload = {}) {
  if (!resourceStore || !discussionPayload || typeof discussionPayload !== 'object') {
    return
  }

  const discussionId = Number(discussionPayload.id || 0)
  if (discussionId > 0) {
    resourceStore.upsert('discussions', discussionPayload)
  }

  const user = discussionPayload.user
  if (user?.id) {
    resourceStore.upsert('users', user)
  }

  const lastPostedUser = discussionPayload.last_posted_user
  if (lastPostedUser?.id) {
    resourceStore.upsert('users', lastPostedUser)
  }

  const tags = Array.isArray(discussionPayload.tags) ? discussionPayload.tags : []
  tags.forEach(tag => {
    if (!tag?.id) return
    resourceStore.upsert('tags', {
      ...tag,
      last_posted_discussion: {
        id: discussionId,
        title: discussionPayload.title,
        slug: discussionPayload.slug,
        last_post_number: discussionPayload.last_post_number,
        last_posted_at: discussionPayload.last_posted_at,
      },
    })
  })
}

export function applyPostResourceAssociations(resourceStore, postPayload = {}) {
  if (!resourceStore || !postPayload || typeof postPayload !== 'object') {
    return
  }

  const discussionId = Number(postPayload.discussion_id || postPayload.discussion?.id || 0)
  if (discussionId > 0 && postPayload.discussion) {
    resourceStore.upsert('discussions', postPayload.discussion)
  }

  if (postPayload.user?.id) {
    resourceStore.upsert('users', postPayload.user)
  }
}
