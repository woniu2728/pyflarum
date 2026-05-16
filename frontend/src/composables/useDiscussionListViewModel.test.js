import test from 'node:test'
import assert from 'node:assert/strict'
import {
  resolveDiscussionListActiveFilterCode,
  resolveDiscussionListPageMetaDescription,
  resolveDiscussionListPageMetaTitle,
} from '../utils/discussionList.js'

test('discussion list view model helper path resolves tag search meta', () => {
  const filterCode = resolveDiscussionListActiveFilterCode({
    isFollowingPage: false,
    listFilter: 'all',
  })

  assert.equal(resolveDiscussionListPageMetaTitle({
    filterCode,
    currentTagName: '公告',
    searchQuery: '维护',
  }), '公告 - 搜索“维护”')

  assert.equal(resolveDiscussionListPageMetaDescription({
    filterCode,
    currentTagName: '公告',
    currentTagDescription: '站点公告',
    searchQuery: '维护',
  }), '查看标签“公告”下与“维护”相关的讨论。')
})

test('discussion list view model helper path resolves following meta', () => {
  const filterCode = resolveDiscussionListActiveFilterCode({
    isFollowingPage: true,
    listFilter: 'all',
  })

  assert.equal(resolveDiscussionListPageMetaTitle({
    filterCode,
    currentTagName: '',
    searchQuery: '',
  }), '关注的讨论')

  assert.equal(resolveDiscussionListPageMetaDescription({
    filterCode,
    currentTagName: '',
    currentTagDescription: '',
    searchQuery: '',
  }), '查看你关注的讨论和最新回复。')
})
