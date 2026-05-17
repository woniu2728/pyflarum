import test from 'node:test'
import assert from 'node:assert/strict'
import {
  getDiscussionListFilterHeroDescriptionText,
  getDiscussionListFilterHeroTitleText,
  getDiscussionListFilterLabelText,
  resolveDiscussionListActiveFilterCode,
  resolveDiscussionListPageMetaDescription,
  resolveDiscussionListPageMetaTitle,
} from './discussionList.js'

test('discussion list helper resolves active filter code with following priority', () => {
  assert.equal(resolveDiscussionListActiveFilterCode({
    isFollowingPage: true,
    listFilter: 'my',
  }), 'following')
  assert.equal(resolveDiscussionListActiveFilterCode({
    isFollowingPage: false,
    listFilter: 'unread',
  }), 'unread')
})

test('discussion list helper resolves filter labels and hero copy', () => {
  assert.equal(getDiscussionListFilterLabelText('my'), '我的讨论')
  assert.equal(getDiscussionListFilterHeroTitleText('unread'), '未读讨论')
  assert.equal(
    getDiscussionListFilterHeroDescriptionText('following'),
    '这里会显示你已关注、并在后续收到新回复通知的讨论。'
  )
})

test('discussion list helper resolves page meta with search and tag context', () => {
  assert.equal(resolveDiscussionListPageMetaTitle({
    filterCode: 'all',
    currentTagName: '公告',
    searchQuery: '维护',
  }), '公告 - 搜索“维护”')

  assert.equal(resolveDiscussionListPageMetaDescription({
    filterCode: 'all',
    currentTagName: '公告',
    currentTagDescription: '站点公告',
    searchQuery: '维护',
  }), '查看标签“公告”下与“维护”相关的讨论。')

  assert.equal(resolveDiscussionListPageMetaDescription({
    filterCode: 'unread',
    currentTagName: '',
    currentTagDescription: '',
    searchQuery: '修复',
  }), '在未读中搜索与“修复”相关的讨论。')

  assert.equal(resolveDiscussionListPageMetaTitle({
    filterCode: 'following',
    currentTagName: '',
    searchQuery: '',
  }), '关注的讨论')

  assert.equal(resolveDiscussionListPageMetaDescription({
    filterCode: 'following',
    currentTagName: '',
    currentTagDescription: '',
    searchQuery: '',
  }), '查看你关注的讨论和最新回复。')
})
