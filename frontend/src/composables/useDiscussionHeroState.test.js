import test from 'node:test'
import assert from 'node:assert/strict'
import { ref } from 'vue'
import { createDiscussionHeroState } from './useDiscussionHeroState.js'

test('discussion hero state resolves meta items and review banner', () => {
  const state = createDiscussionHeroState({
    canEditDiscussion: ref(true),
    canModeratePendingDiscussion: ref(false),
    discussion: ref({ id: 12, title: '讨论' }),
    getHeroMeta: () => [{ key: 'author', text: 'alice' }],
    getReviewBanner: () => ({ title: '待审核', message: '请处理' }),
  })

  assert.deepEqual(state.heroMetaItems.value, [{ key: 'author', text: 'alice' }])
  assert.deepEqual(state.discussionReviewBanner.value, { title: '待审核', message: '请处理' })
})
