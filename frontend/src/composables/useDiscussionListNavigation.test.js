import test from 'node:test'
import assert from 'node:assert/strict'
import { ref } from 'vue'
import { createDiscussionListNavigation } from './useDiscussionListNavigation.js'

test('discussion list navigation resolves sidebar filters and page state copy', () => {
  const state = createDiscussionListNavigation({
    authStore: { user: { id: 7 } },
    currentTag: ref({ slug: 'announcements', color: '#112233' }),
    currentTagSlug: ref('announcements'),
    filterOptions: ref([
      { code: 'all', sidebar_visible: true },
      { code: 'following', sidebar_visible: true, requires_authenticated_user: true },
    ]),
    getDefaultFilterLabelText: (code) => `${code}-fallback`,
    getDiscussionEmptyState: () => ({ text: 'empty-copy' }),
    getDiscussionForumNavItems: () => [
      { key: 'home', label: '全部讨论', icon: 'far fa-comments' },
      { key: 'following', label: '关注中', icon: 'fas fa-bell' },
    ],
    getDiscussionLoadingState: () => ({ text: 'loading-copy' }),
    isFollowingPage: ref(false),
    listFilter: ref('all'),
    route: { name: 'home', params: {} },
    tags: ref([
      { id: 1, slug: 'announcements', color: '#112233', children: [] },
      { id: 2, slug: 'general', color: '#334455', children: [] },
    ]),
  })

  assert.equal(state.isTagsPage.value, false)
  assert.equal(state.isAllDiscussionsPage.value, false)
  assert.equal(state.emptyStateText.value, 'empty-copy')
  assert.equal(state.loadingStateText.value, 'loading-copy')
  assert.equal(state.showMoreTagsLink.value, true)
  assert.deepEqual(state.startDiscussionButtonStyle.value, {
    '--tag-button-bg': '#112233',
    '--tag-button-text': '#ffffff',
  })
  assert.equal(state.sidebarFilterItems.value[0].label, '全部讨论')
  assert.equal(state.sidebarFilterItems.value[1].label, '关注中')
})

test('discussion list navigation hides auth-only filters and falls back to default copy', () => {
  const state = createDiscussionListNavigation({
    authStore: { user: null },
    currentTag: ref(null),
    currentTagSlug: ref(''),
    filterOptions: ref([{ code: 'unread', sidebar_visible: true, requires_authenticated_user: true }]),
    getDefaultFilterLabelText: (code) => `${code}-fallback`,
    getDiscussionEmptyState: () => null,
    getDiscussionForumNavItems: () => [],
    getDiscussionLoadingState: () => null,
    isFollowingPage: ref(false),
    listFilter: ref('all'),
    route: { name: 'tags', params: {} },
    tags: ref([]),
  })

  assert.equal(state.isTagsPage.value, true)
  assert.equal(state.isAllDiscussionsPage.value, false)
  assert.equal(state.emptyStateText.value, '暂无讨论。')
  assert.equal(state.loadingStateText.value, '正在加载讨论...')
  assert.deepEqual(state.sidebarFilterItems.value, [])
  assert.equal(state.hasSidebarTagNavigation.value, false)
  assert.equal(state.showMoreTagsLink.value, false)
})
