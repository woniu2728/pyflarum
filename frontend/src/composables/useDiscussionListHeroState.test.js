import test from 'node:test'
import assert from 'node:assert/strict'
import { ref } from 'vue'
import { createDiscussionListHeroState } from './useDiscussionListHeroState.js'

test('discussion list hero state resolves filter hero copy and icon', () => {
  const state = createDiscussionListHeroState({
    currentTag: ref(null),
    getText: ({ surface }) => ({ text: `${surface}-copy` }),
    isFollowingPage: ref(false),
    listFilter: ref('unread'),
  })

  assert.equal(state.activeFilterCode.value, 'unread')
  assert.equal(state.showFilterHero.value, true)
  assert.equal(state.filterHeroPillText.value, 'discussion-list-filter-hero-pill-copy')
  assert.equal(state.filterHeroTitleText.value, 'discussion-list-filter-hero-title-copy')
  assert.equal(state.filterHeroDescriptionText.value, 'discussion-list-filter-hero-description-copy')
  assert.equal(state.filterHeroIcon.value, 'fas fa-inbox')
})

test('discussion list hero state falls back to tag description defaults', () => {
  const state = createDiscussionListHeroState({
    currentTag: ref({ name: '公告' }),
    getText: () => null,
    isFollowingPage: ref(false),
    listFilter: ref('all'),
  })

  assert.equal(state.showFilterHero.value, false)
  assert.equal(state.currentTagDescriptionText.value, '这个标签下的讨论会集中显示在这里。')
})
