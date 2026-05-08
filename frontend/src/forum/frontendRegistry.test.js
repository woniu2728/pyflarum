import test from 'node:test'
import assert from 'node:assert/strict'
import {
  getDiscussionReplyState,
  getPostReviewBanner,
  getPostStateBadges,
  registerDiscussionReplyState,
  registerPostReviewBanner,
  registerPostStateBadge,
} from './frontendRegistry.js'

function uniqueKey(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

test('discussion reply state returns the first visible item by order', () => {
  const highOrderKey = uniqueKey('reply-high')
  const lowOrderKey = uniqueKey('reply-low')

  registerDiscussionReplyState({
    key: highOrderKey,
    order: 30,
    isVisible: () => true,
    resolve: () => ({ kind: 'notice', message: 'high' }),
  })

  registerDiscussionReplyState({
    key: lowOrderKey,
    order: 10,
    isVisible: () => true,
    resolve: () => ({ kind: 'notice', message: 'low' }),
  })

  const result = getDiscussionReplyState({})

  assert.equal(result.key, lowOrderKey)
  assert.equal(result.message, 'low')
})

test('discussion reply state respects surface filtering', () => {
  const scopedKey = uniqueKey('reply-surface')

  registerDiscussionReplyState({
    key: scopedKey,
    order: 10,
    surfaces: ['discussion-reply'],
    isVisible: () => true,
    resolve: () => ({ kind: 'notice', message: 'scoped' }),
  })

  const fallbackResult = getDiscussionReplyState({ surface: 'other-surface' })
  assert.equal(fallbackResult.message, 'low')
  assert.equal(getDiscussionReplyState({}).message, 'low')

  const result = getDiscussionReplyState({ surface: 'discussion-reply' })
  assert.equal(result.key, scopedKey)
  assert.equal(result.message, 'scoped')
})

test('post state badges are ordered and filtered by surface', () => {
  const detailKey = uniqueKey('post-detail')
  const profileKey = uniqueKey('post-profile')

  registerPostStateBadge({
    key: detailKey,
    order: 20,
    surfaces: ['discussion-post'],
    isVisible: ({ post }) => Boolean(post?.needsReview),
    resolve: ({ post }) => ({
      label: `${post.count} pending`,
      tone: 'warning',
    }),
  })

  registerPostStateBadge({
    key: profileKey,
    order: 10,
    surfaces: ['profile-post'],
    isVisible: () => true,
    resolve: () => ({
      label: 'profile',
      tone: 'info',
    }),
  })

  const detailBadges = getPostStateBadges({
    post: { needsReview: true, count: 3 },
    surface: 'discussion-post',
  })
  const profileBadges = getPostStateBadges({
    post: { needsReview: true, count: 3 },
    surface: 'profile-post',
  })

  assert.equal(detailBadges.some(item => item.key === detailKey), true)
  assert.equal(detailBadges.some(item => item.key === profileKey), false)
  assert.equal(profileBadges.some(item => item.key === profileKey), true)
  assert.equal(profileBadges.some(item => item.key === detailKey), false)
  assert.equal(detailBadges.find(item => item.key === detailKey).label, '3 pending')
})

test('post review banner prefers matching surface-specific item', () => {
  const fallbackKey = uniqueKey('post-review-fallback')
  const scopedKey = uniqueKey('post-review-scoped')

  registerPostReviewBanner({
    key: fallbackKey,
    order: 30,
    isVisible: () => true,
    resolve: () => ({
      message: 'fallback',
      tone: 'warning',
      actions: [],
    }),
  })

  registerPostReviewBanner({
    key: scopedKey,
    order: 40,
    surfaces: ['discussion-post'],
    isVisible: ({ post }) => post?.approval_status === 'pending',
    resolve: () => ({
      message: 'scoped',
      tone: 'warning',
      actions: [{ key: 'approve', label: '审核通过', action: 'approve' }],
    }),
  })

  const surfaceResult = getPostReviewBanner({
    post: { approval_status: 'pending' },
    surface: 'discussion-post',
  })
  const fallbackResult = getPostReviewBanner({
    post: { approval_status: 'pending' },
    surface: 'other-surface',
  })

  assert.equal(surfaceResult.key, scopedKey)
  assert.equal(surfaceResult.message, 'scoped')
  assert.equal(surfaceResult.actions.length, 1)
  assert.equal(fallbackResult.key, fallbackKey)
  assert.equal(fallbackResult.message, 'fallback')
})
