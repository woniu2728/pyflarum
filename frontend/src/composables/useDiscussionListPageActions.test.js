import test from 'node:test'
import assert from 'node:assert/strict'
import { useDiscussionListPageActions } from './useDiscussionListPageActions.js'

test('discussion list page actions pass current tag and route name to start discussion', () => {
  const calls = []
  const actions = useDiscussionListPageActions({
    currentTag: {
      value: { id: 42 },
    },
    route: {
      name: 'following',
    },
    startDiscussion(payload) {
      calls.push(payload)
      return true
    },
  })

  const result = actions.handleStartDiscussion()

  assert.equal(result, true)
  assert.deepEqual(calls, [{
    tagId: 42,
    source: 'following',
  }])
})

test('discussion list page actions fall back to index source when route name is absent', () => {
  const calls = []
  const actions = useDiscussionListPageActions({
    currentTag: {
      value: null,
    },
    route: {
      name: null,
    },
    startDiscussion(payload) {
      calls.push(payload)
      return false
    },
  })

  const result = actions.handleStartDiscussion()

  assert.equal(result, false)
  assert.deepEqual(calls, [{
    tagId: undefined,
    source: 'index',
  }])
})
