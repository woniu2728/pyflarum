import test from 'node:test'
import assert from 'node:assert/strict'
import { ref } from 'vue'
import { createDiscussionListSidebarStartButtonState } from './useDiscussionListSidebarStartButtonState.js'

test('discussion list sidebar start button state resolves registry copy', () => {
  const state = createDiscussionListSidebarStartButtonState({
    currentTag: ref({ name: '公告' }),
    getText: ({ surface, tagName }) => ({ text: `${surface}-${tagName}-copy` }),
  })

  assert.equal(state.labelText.value, 'start-discussion-button-公告-copy')
})

test('discussion list sidebar start button state falls back to default label', () => {
  const state = createDiscussionListSidebarStartButtonState({
    currentTag: ref(null),
    getText: () => null,
  })

  assert.equal(state.labelText.value, '发起讨论')
})
