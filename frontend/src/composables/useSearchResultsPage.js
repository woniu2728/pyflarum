import { computed, ref, watch } from 'vue'
import api from '@/api'
import { useResourceStore } from '@/stores/resource'
import { normalizeDiscussion, normalizePost, normalizeUser, unwrapList } from '@/utils/forum'
import { highlightSearchText } from '@/utils/search'
import { renderTwemojiHtml } from '@/utils/twemoji'

export function useSearchResultsPage({ route, router }) {
  const resourceStore = useResourceStore()
  const loading = ref(false)
  const total = ref(0)
  const discussionTotal = ref(0)
  const postTotal = ref(0)
  const userTotal = ref(0)
  const discussionIds = ref([])
  const postIds = ref([])
  const userIds = ref([])
  const discussions = computed(() => resourceStore.list('discussions', discussionIds.value))
  const posts = computed(() => resourceStore.list('posts', postIds.value))
  const users = computed(() => resourceStore.list('users', userIds.value))

  const normalizedQuery = computed(() => String(route.query.q || '').trim())
  const searchType = computed(() => {
    const value = String(route.query.type || 'all')
    return ['all', 'discussions', 'posts', 'users'].includes(value) ? value : 'all'
  })
  const page = computed(() => {
    const value = Number(route.query.page || 1)
    return Number.isFinite(value) && value > 0 ? value : 1
  })
  const totalPages = computed(() => Math.max(1, Math.ceil(total.value / 20)))
  const isEmpty = computed(() => !discussions.value.length && !posts.value.length && !users.value.length)
  const showDiscussions = computed(() => searchType.value === 'all' || searchType.value === 'discussions')
  const showPosts = computed(() => searchType.value === 'all' || searchType.value === 'posts')
  const showUsers = computed(() => searchType.value === 'all' || searchType.value === 'users')
  const filterItems = computed(() => [
    { value: 'all', label: '全部', count: discussionTotal.value + postTotal.value + userTotal.value },
    { value: 'discussions', label: '讨论', count: discussionTotal.value },
    { value: 'posts', label: '帖子', count: postTotal.value },
    { value: 'users', label: '用户', count: userTotal.value }
  ])
  const heroText = computed(() => {
    if (!normalizedQuery.value) {
      return '支持在讨论、帖子和用户之间进行全局搜索。'
    }

    if (searchType.value === 'all') {
      return `共找到 ${discussionTotal.value + postTotal.value + userTotal.value} 条结果，已按讨论、帖子和用户分组展示。`
    }

    const labelMap = {
      discussions: '讨论',
      posts: '帖子',
      users: '用户'
    }
    return `当前显示 ${labelMap[searchType.value]}结果，共 ${total.value} 条。`
  })

  watch(
    () => [normalizedQuery.value, searchType.value, page.value],
    async () => {
      await loadResults()
    },
    { immediate: true }
  )

  async function loadResults() {
    if (!normalizedQuery.value) {
      resetResults()
      return
    }

    loading.value = true
    try {
      const data = await api.get('/search', {
        params: {
          q: normalizedQuery.value,
          type: searchType.value,
          page: page.value,
          limit: 20
        }
      })

      total.value = data.total || 0
      discussionTotal.value = data.discussion_total ?? (data.discussions || []).length
      postTotal.value = data.post_total ?? (data.posts || []).length
      userTotal.value = data.user_total ?? (data.users || []).length
      discussionIds.value = unwrapList(data.discussions || [])
        .map(normalizeDiscussion)
        .map(item => resourceStore.upsert('discussions', item).id)
      postIds.value = unwrapList(data.posts || [])
        .map(normalizePost)
        .map(item => resourceStore.upsert('posts', item).id)
      userIds.value = unwrapList(data.users || [])
        .map(normalizeUser)
        .map(item => resourceStore.upsert('users', item).id)
    } catch (error) {
      console.error('加载搜索结果失败:', error)
      resetResults()
    } finally {
      loading.value = false
    }
  }

  function resetResults() {
    total.value = 0
    discussionTotal.value = 0
    postTotal.value = 0
    userTotal.value = 0
    discussionIds.value = []
    postIds.value = []
    userIds.value = []
  }

  function changeType(type) {
    router.push({
      path: '/search',
      query: {
        q: normalizedQuery.value,
        type,
        ...(type === 'all' ? {} : { page: 1 })
      }
    })
  }

  function changePage(nextPage) {
    router.push({
      path: '/search',
      query: {
        q: normalizedQuery.value,
        type: searchType.value,
        page: nextPage
      }
    })
  }

  function getDiscussionTitleHtml(discussion) {
    return renderTwemojiHtml(highlightSearchText(discussion.title || '讨论', normalizedQuery.value, 90))
  }

  function getDiscussionExcerptHtml(discussion) {
    return renderTwemojiHtml(highlightSearchText(discussion.excerpt || '这个讨论没有更多摘要。', normalizedQuery.value, 180))
  }

  function getPostTitleHtml(post) {
    return renderTwemojiHtml(highlightSearchText(post.discussion_title || '帖子结果', normalizedQuery.value, 90))
  }

  function getPostExcerptHtml(post) {
    return renderTwemojiHtml(highlightSearchText(post.excerpt || post.content || '', normalizedQuery.value, 200))
  }

  function getUserTitleHtml(user) {
    return renderTwemojiHtml(highlightSearchText(user.display_name || user.username || '用户', normalizedQuery.value, 80))
  }

  function getUserSubtitleHtml(user) {
    return renderTwemojiHtml(highlightSearchText(user.bio || `@${user.username}`, normalizedQuery.value, 150))
  }

  return {
    changePage,
    changeType,
    discussionTotal,
    discussions,
    filterItems,
    getDiscussionExcerptHtml,
    getDiscussionTitleHtml,
    getPostExcerptHtml,
    getPostTitleHtml,
    getUserSubtitleHtml,
    getUserTitleHtml,
    heroText,
    isEmpty,
    loading,
    normalizedQuery,
    page,
    postTotal,
    posts,
    searchType,
    showDiscussions,
    showPosts,
    showUsers,
    total,
    totalPages,
    userTotal,
    users
  }
}
