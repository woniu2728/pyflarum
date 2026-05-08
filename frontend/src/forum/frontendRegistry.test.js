import test from 'node:test'
import assert from 'node:assert/strict'
import {
  getApprovalNote,
  getDiscussionReplyState,
  getDiscussionReviewBanner,
  getEmptyState,
  getPostFlagPanel,
  getPostReviewBanner,
  getPostStateBadges,
  registerApprovalNote,
  registerDiscussionReplyState,
  registerDiscussionReviewBanner,
  registerEmptyState,
  registerPostFlagPanel,
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

test('discussion review banner prefers matching surface-specific item', () => {
  const fallbackKey = uniqueKey('discussion-review-fallback')
  const scopedKey = uniqueKey('discussion-review-scoped')

  registerDiscussionReviewBanner({
    key: fallbackKey,
    order: 30,
    isVisible: () => true,
    resolve: () => ({
      title: 'fallback',
      message: 'fallback message',
      tone: 'warning',
      actions: [],
    }),
  })

  registerDiscussionReviewBanner({
    key: scopedKey,
    order: 40,
    surfaces: ['discussion-hero'],
    isVisible: ({ discussion }) => discussion?.approval_status === 'pending',
    resolve: () => ({
      title: 'scoped',
      message: 'scoped message',
      tone: 'warning',
      actions: [{ key: 'approve', label: '审核通过', action: 'approve' }],
    }),
  })

  const surfaceResult = getDiscussionReviewBanner({
    discussion: { approval_status: 'pending' },
    surface: 'discussion-hero',
  })
  const fallbackResult = getDiscussionReviewBanner({
    discussion: { approval_status: 'pending' },
    surface: 'other-surface',
  })

  assert.equal(surfaceResult.key, scopedKey)
  assert.equal(surfaceResult.title, 'scoped')
  assert.equal(surfaceResult.actions.length, 1)
  assert.equal(fallbackResult.key, fallbackKey)
  assert.equal(fallbackResult.message, 'fallback message')
})

test('post flag panel prefers matching surface-specific item', () => {
  const fallbackKey = uniqueKey('post-flag-fallback')
  const scopedKey = uniqueKey('post-flag-scoped')

  registerPostFlagPanel({
    key: fallbackKey,
    order: 30,
    isVisible: () => true,
    resolve: () => ({
      title: 'fallback',
      description: 'fallback description',
      items: [],
      actions: [],
    }),
  })

  registerPostFlagPanel({
    key: scopedKey,
    order: 40,
    surfaces: ['discussion-post'],
    isVisible: ({ post }) => Boolean(post?.open_flag_count > 0),
    resolve: ({ post }) => ({
      title: 'scoped',
      description: 'scoped description',
      items: [{ key: 1, reason: 'spam', userLabel: 'mod', message: 'details' }],
      actions: [{ key: 'resolved', label: `${post.open_flag_count} actions`, status: 'resolved' }],
    }),
  })

  const surfaceResult = getPostFlagPanel({
    post: { open_flag_count: 2 },
    surface: 'discussion-post',
  })
  const fallbackResult = getPostFlagPanel({
    post: { open_flag_count: 2 },
    surface: 'other-surface',
  })

  assert.equal(surfaceResult.key, scopedKey)
  assert.equal(surfaceResult.title, 'scoped')
  assert.equal(surfaceResult.items.length, 1)
  assert.equal(surfaceResult.actions[0].label, '2 actions')
  assert.equal(fallbackResult.key, fallbackKey)
  assert.equal(fallbackResult.description, 'fallback description')
})

test('approval note prefers matching surface-specific item', () => {
  const fallbackKey = uniqueKey('approval-note-fallback')
  const scopedKey = uniqueKey('approval-note-scoped')

  registerApprovalNote({
    key: fallbackKey,
    order: 30,
    isVisible: () => true,
    resolve: () => ({
      text: 'fallback note',
    }),
  })

  registerApprovalNote({
    key: scopedKey,
    order: 40,
    surfaces: ['profile-post'],
    isVisible: ({ post }) => Boolean(post?.approval_note),
    resolve: ({ post }) => ({
      text: `scoped note: ${post.approval_note}`,
    }),
  })

  const surfaceResult = getApprovalNote({
    post: { approval_note: 'detail' },
    surface: 'profile-post',
  })
  const fallbackResult = getApprovalNote({
    post: { approval_note: 'detail' },
    surface: 'other-surface',
  })

  assert.equal(surfaceResult.key, scopedKey)
  assert.equal(surfaceResult.text, 'scoped note: detail')
  assert.equal(fallbackResult.key, fallbackKey)
  assert.equal(fallbackResult.text, 'fallback note')
})

test('empty state prefers matching surface-specific item', () => {
  const fallbackKey = uniqueKey('empty-fallback')
  const scopedKey = uniqueKey('empty-scoped')

  registerEmptyState({
    key: fallbackKey,
    order: 30,
    isVisible: () => true,
    resolve: () => ({
      text: 'fallback empty',
    }),
  })

  registerEmptyState({
    key: scopedKey,
    order: 40,
    surfaces: ['profile-post-empty'],
    isVisible: ({ posts }) => Array.isArray(posts) && posts.length === 0,
    resolve: ({ isOwnProfile }) => ({
      text: isOwnProfile ? 'my empty' : 'other empty',
    }),
  })

  const surfaceResult = getEmptyState({
    posts: [],
    isOwnProfile: true,
    surface: 'profile-post-empty',
  })
  const fallbackResult = getEmptyState({
    posts: [],
    isOwnProfile: true,
    surface: 'other-surface',
  })

  assert.equal(surfaceResult.key, scopedKey)
  assert.equal(surfaceResult.text, 'my empty')
  assert.equal(fallbackResult.key, fallbackKey)
  assert.equal(fallbackResult.text, 'fallback empty')
})

test('empty state resolves discussion list entries by list context', () => {
  const followingKey = uniqueKey('discussion-list-following-empty')
  const defaultKey = uniqueKey('discussion-list-default-empty')

  registerEmptyState({
    key: followingKey,
    order: 10,
    surfaces: ['discussion-list-empty'],
    isVisible: ({ isFollowingPage }) => Boolean(isFollowingPage),
    resolve: () => ({
      text: 'following empty',
    }),
  })

  registerEmptyState({
    key: defaultKey,
    order: 20,
    surfaces: ['discussion-list-empty'],
    isVisible: () => true,
    resolve: () => ({
      text: 'discussion default empty',
    }),
  })

  const followingResult = getEmptyState({
    surface: 'discussion-list-empty',
    isFollowingPage: true,
    listFilter: 'all',
    currentTag: null,
  })
  const defaultResult = getEmptyState({
    surface: 'discussion-list-empty',
    isFollowingPage: false,
    listFilter: 'all',
    currentTag: null,
  })

  assert.equal(followingResult.key, followingKey)
  assert.equal(followingResult.text, 'following empty')
  assert.equal(defaultResult.key, defaultKey)
  assert.equal(defaultResult.text, 'discussion default empty')
})
