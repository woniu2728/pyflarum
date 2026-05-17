import test from 'node:test'
import assert from 'node:assert/strict'
import { createDiscussionListPageLifecycle } from './useDiscussionListPageLifecycle.js'

function createLifecycleHarness() {
  const calls = []
  const lifecycle = createDiscussionListPageLifecycle({
    addDiscussionReadStateListener() {
      calls.push('add-discussion-read-state-listener')
    },
    addForumEventListener() {
      calls.push('add-forum-event-listener')
    },
    cleanupTrackedDiscussionIds() {
      calls.push('cleanup-tracked-discussion-ids')
    },
    removeDiscussionReadStateListener() {
      calls.push('remove-discussion-read-state-listener')
    },
    removeForumEventListener() {
      calls.push('remove-forum-event-listener')
    },
    syncTrackedDiscussionIds(nextDiscussionIds, previousDiscussionIds) {
      calls.push(['sync-tracked-discussion-ids', nextDiscussionIds, previousDiscussionIds])
    },
  })

  return {
    calls,
    lifecycle,
  }
}

test('discussion list page lifecycle registers browser listeners on mount', () => {
  const harness = createLifecycleHarness()

  harness.lifecycle.handleMounted()

  assert.deepEqual(harness.calls, [
    'add-discussion-read-state-listener',
    'add-forum-event-listener',
  ])
})

test('discussion list page lifecycle clears tracked ids and listeners on unmount', () => {
  const harness = createLifecycleHarness()

  harness.lifecycle.handleBeforeUnmount()

  assert.deepEqual(harness.calls, [
    'cleanup-tracked-discussion-ids',
    'remove-discussion-read-state-listener',
    'remove-forum-event-listener',
  ])
})

test('discussion list page lifecycle delegates tracked discussion synchronization', () => {
  const harness = createLifecycleHarness()

  harness.lifecycle.handleCurrentDiscussionIdsChange([1, 2], [2, 3])

  assert.deepEqual(harness.calls, [
    ['sync-tracked-discussion-ids', [1, 2], [2, 3]],
  ])
})
