import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildDiscussionFilterLocation,
  buildDiscussionListPrimaryTagItems,
  buildDiscussionListSecondaryTagItems,
  findDiscussionListSidebarContextParent,
  getDiscussionListContrastColor,
  getDiscussionListStartButtonStyle,
  isDiscussionFilterActive,
  isDiscussionSidebarTagActive,
} from './discussionListNavigation.js'

test('discussion list navigation builds filter locations from route metadata', () => {
  assert.equal(buildDiscussionFilterLocation({ code: 'following', route_path: '/following' }), '/following')
  assert.deepEqual(buildDiscussionFilterLocation({ code: 'unread' }), {
    path: '/',
    query: {
      filter: 'unread',
    },
  })
})

test('discussion list navigation resolves active filter state', () => {
  assert.equal(isDiscussionFilterActive({
    currentTagSlug: '',
    routeName: 'following',
    isFollowingPage: true,
    listFilter: 'all',
    filterCode: 'following',
  }), true)

  assert.equal(isDiscussionFilterActive({
    currentTagSlug: 'announcements',
    routeName: 'home',
    isFollowingPage: false,
    listFilter: 'all',
    filterCode: 'all',
  }), false)
})

test('discussion list navigation derives sidebar tag context and ordering', () => {
  const normalizedTags = [
    {
      id: 1,
      slug: 'parent',
      position: 1,
      discussion_count: 5,
      children: [{ id: 2, slug: 'child' }],
    },
    {
      id: 2,
      slug: 'child',
      position: 2,
      parent_id: 1,
      discussion_count: 3,
      children: [],
    },
    {
      id: 3,
      slug: 'secondary',
      position: null,
      discussion_count: 9,
      children: [],
    },
  ]

  const contextParent = findDiscussionListSidebarContextParent('child', normalizedTags)
  assert.equal(contextParent?.slug, 'parent')
  assert.deepEqual(
    buildDiscussionListPrimaryTagItems(normalizedTags, contextParent).map(tag => tag.slug),
    ['parent', 'child']
  )
  assert.deepEqual(
    buildDiscussionListSecondaryTagItems(normalizedTags).map(tag => tag.slug),
    ['secondary']
  )
})

test('discussion list navigation derives start button style and active parent tags', () => {
  const normalizedTags = [
    {
      id: 1,
      slug: 'parent',
      position: 1,
      children: [{ id: 2, slug: 'child' }],
    },
  ]

  assert.equal(getDiscussionListContrastColor('#ffffff'), '#243447')
  assert.deepEqual(getDiscussionListStartButtonStyle({ color: '#112233' }), {
    '--tag-button-bg': '#112233',
    '--tag-button-text': '#ffffff',
  })
  assert.equal(isDiscussionSidebarTagActive({
    currentTag: { parent_id: 1 },
    currentTagSlug: 'child',
    normalizedTags,
    tag: { slug: 'parent' },
  }), true)
})
