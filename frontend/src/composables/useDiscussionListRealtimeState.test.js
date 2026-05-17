import test from 'node:test'
import assert from 'node:assert/strict'
import { createDiscussionListRealtimeState } from './useDiscussionListRealtimeState.js'

function createRealtimeHarness(overrides = {}) {
  const alerts = []
  const upserts = []
  const merged = []
  const refreshCalls = []
  const posts = []
  const store = new Map()
  const resourceStore = {
    get(type, id) {
      return store.get(`${type}:${id}`) || null
    },
    upsert(type, resource) {
      upserts.push([type, resource])
      store.set(`${type}:${resource.id}`, resource)
    },
  }
  const realtime = createDiscussionListRealtimeState({
    api: overrides.api || {
      async post(url) {
        posts.push(url)
        return { marked_all_as_read_at: '2026-05-17T00:00:00Z' }
      },
    },
    authStore: overrides.authStore || { isAuthenticated: true },
    currentDiscussionIds: overrides.currentDiscussionIds || { value: [1, 2] },
    markingAllRead: overrides.markingAllRead || { value: false },
    modalStore: overrides.modalStore || {
      async alert(payload) {
        alerts.push(payload)
      },
    },
    refreshDiscussionList: overrides.refreshDiscussionList || (async () => {
      refreshCalls.push('refresh')
    }),
    resourceStore,
    uiText: overrides.uiText || ((surface, fallback) => fallback),
    mergeEventPayload: overrides.mergeEventPayload || ((targetStore, payload) => {
      merged.push([targetStore, payload])
    }),
    shouldRefreshEvent: overrides.shouldRefreshEvent || (() => false),
  })

  return {
    alerts,
    merged,
    posts,
    refreshCalls,
    realtime,
    resourceStore,
    store,
    upserts,
  }
}

test('discussion list realtime state patches read state updates into the resource store', () => {
  const harness = createRealtimeHarness()
  harness.store.set('discussions:7', {
    id: 7,
    unread_count: 4,
    last_read_post_number: 2,
    last_read_at: null,
    is_unread: true,
  })

  harness.realtime.handleDiscussionReadStateUpdated({
    detail: {
      discussionId: 7,
      lastReadAt: '2026-05-17T01:00:00Z',
      lastReadPostNumber: 6,
      unreadCount: 1,
    },
  })

  assert.deepEqual(harness.upserts, [[
    'discussions',
    {
      id: 7,
      unread_count: 1,
      last_read_post_number: 6,
      last_read_at: '2026-05-17T01:00:00Z',
      is_unread: true,
    },
  ]])
})

test('discussion list realtime state refreshes list for refresh-only forum events', async () => {
  const harness = createRealtimeHarness({
    shouldRefreshEvent: eventType => eventType === 'discussion_hidden',
  })

  await harness.realtime.handleForumEvent({
    detail: {
      discussion_id: 1,
      event_type: 'discussion_hidden',
    },
  })

  assert.deepEqual(harness.refreshCalls, ['refresh'])
  assert.deepEqual(harness.merged, [])
})

test('discussion list realtime state merges visible forum events into resources', async () => {
  const harness = createRealtimeHarness()

  await harness.realtime.handleForumEvent({
    detail: {
      discussion_id: 2,
      event_type: 'discussion_updated',
    },
  })

  assert.equal(harness.refreshCalls.length, 0)
  assert.deepEqual(harness.merged, [[harness.resourceStore, {
    discussion_id: 2,
    event_type: 'discussion_updated',
  }]])
})

test('discussion list realtime state marks visible discussions as read in bulk', async () => {
  const harness = createRealtimeHarness()
  harness.store.set('discussions:1', {
    id: 1,
    is_unread: true,
    unread_count: 3,
    last_post_number: 8,
    last_read_post_number: 2,
    last_read_at: null,
  })
  harness.store.set('discussions:2', {
    id: 2,
    is_unread: false,
    unread_count: 0,
    last_post_number: 5,
    last_read_post_number: 5,
    last_read_at: null,
  })

  await harness.realtime.markAllAsRead()

  assert.deepEqual(harness.posts, ['/discussions/read-all'])
  assert.deepEqual(harness.upserts, [[
    'discussions',
    {
      id: 1,
      is_unread: false,
      unread_count: 0,
      last_post_number: 8,
      last_read_post_number: 8,
      last_read_at: '2026-05-17T00:00:00Z',
    },
  ], [
    'discussions',
    {
      id: 2,
      is_unread: false,
      unread_count: 0,
      last_post_number: 5,
      last_read_post_number: 5,
      last_read_at: '2026-05-17T00:00:00Z',
    },
  ]])
})
