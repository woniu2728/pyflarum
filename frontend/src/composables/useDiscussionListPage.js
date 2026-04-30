import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import api from '@/api'
import { useStartDiscussionAction } from '@/composables/useStartDiscussionAction'
import {
  flattenTags,
  normalizeDiscussion,
  normalizeTag,
  unwrapList
} from '@/utils/forum'

export function useDiscussionListPage({
  authStore,
  composerStore,
  modalStore,
  route,
  router
}) {
  const discussions = ref([])
  const tags = ref([])
  const currentTag = ref(null)
  const loading = ref(true)
  const loadingMore = ref(false)
  const sortBy = ref('latest')
  const currentPage = ref(1)
  const total = ref(0)
  const markingAllRead = ref(false)
  const pageSize = 20
  const { startDiscussion } = useStartDiscussionAction({
    authStore,
    composerStore,
    router
  })

  const currentTagSlug = computed(() => route.params.slug || null)
  const searchQuery = computed(() => route.query.search?.toString().trim() || '')
  const hasMore = computed(() => currentPage.value * pageSize < total.value)
  const isFollowingPage = computed(() => route.name === 'following')
  const isTagsPage = computed(() => route.name === 'tags')
  const isAllDiscussionsPage = computed(() => route.name === 'home' && !currentTagSlug.value)
  const isOwnProfilePage = computed(() => {
    if (!authStore.user) return false

    return (
      route.name === 'profile'
      || (route.name === 'user-profile' && String(route.params.id) === String(authStore.user.id))
    )
  })
  const currentTagContextParent = computed(() => findSidebarContextParent(currentTagSlug.value, tags.value))
  const sidebarPrimaryTagItems = computed(() => buildSidebarPrimaryTagItems(tags.value, currentTagContextParent.value))
  const sidebarSecondaryTagItems = computed(() => buildSidebarSecondaryTagItems(tags.value))
  const hasSidebarTagNavigation = computed(() => tags.value.length > 0)
  const showMoreTagsLink = computed(() => sidebarSecondaryTagItems.value.length > 0)
  const startDiscussionButtonStyle = computed(() => getStartDiscussionButtonStyle(currentTag.value))
  const emptyStateText = computed(() => {
    if (isFollowingPage.value) {
      return '你还没有关注任何讨论。'
    }
    if (currentTag.value) {
      return '这个标签下还没有讨论。'
    }
    return '暂无讨论。'
  })

  onMounted(async () => {
    await refreshPageData()
    window.addEventListener('bias:discussion-read-state-updated', handleDiscussionReadStateUpdated)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('bias:discussion-read-state-updated', handleDiscussionReadStateUpdated)
  })

  watch(
    () => [route.name, route.params.slug, route.query.search],
    async () => {
      currentPage.value = 1
      await refreshPageData()
    }
  )

  async function refreshPageData() {
    loading.value = true
    try {
      await Promise.all([loadTags(), loadCurrentTag(), loadDiscussions(false)])
    } catch (error) {
      discussions.value = []
      currentTag.value = null
      console.error('加载首页列表失败:', error)
    } finally {
      loading.value = false
    }
  }

  async function loadTags() {
    const response = await api.get('/tags', {
      params: {
        include_children: true
      }
    })
    tags.value = unwrapList(response).map(normalizeTag)
  }

  async function loadCurrentTag() {
    if (!currentTagSlug.value || isFollowingPage.value) {
      currentTag.value = null
      return
    }

    try {
      const response = await api.get(`/tags/slug/${currentTagSlug.value}`)
      currentTag.value = normalizeTag(response)
    } catch (error) {
      currentTag.value = null
      console.error('加载标签详情失败:', error)
    }
  }

  async function loadDiscussions(append) {
    const response = await api.get('/discussions/', {
      params: {
        page: currentPage.value,
        limit: pageSize,
        sort: sortBy.value,
        q: searchQuery.value || undefined,
        tag: currentTagSlug.value || undefined,
        subscription: isFollowingPage.value ? 'following' : undefined
      }
    })

    const items = unwrapList(response).map(normalizeDiscussion)

    if (append) {
      discussions.value.push(...items)
    } else {
      discussions.value = items
    }

    total.value = response.total || items.length
  }

  async function changeSortBy(sort) {
    if (sortBy.value === sort) return
    sortBy.value = sort
    currentPage.value = 1
    loading.value = true

    try {
      await loadDiscussions(false)
    } finally {
      loading.value = false
    }
  }

  async function loadMore() {
    loadingMore.value = true
    currentPage.value += 1
    try {
      await loadDiscussions(true)
    } finally {
      loadingMore.value = false
    }
  }

  async function markAllAsRead() {
    if (!authStore.isAuthenticated || markingAllRead.value) return

    markingAllRead.value = true
    try {
      const response = await api.post('/discussions/read-all')
      discussions.value = discussions.value.map(discussion => ({
        ...discussion,
        is_unread: false,
        unread_count: 0,
        last_read_post_number: discussion.last_post_number || discussion.last_read_post_number || 0,
        last_read_at: response.marked_all_as_read_at || discussion.last_read_at
      }))
    } catch (error) {
      console.error('标记已读失败:', error)
      await modalStore.alert({
        title: '标记已读失败',
        message: '请稍后重试',
        tone: 'danger'
      })
    } finally {
      markingAllRead.value = false
    }
  }

  function handleDiscussionReadStateUpdated(event) {
    const detail = event.detail || {}
    const discussionId = Number(detail.discussionId)
    if (!discussionId) return

    discussions.value = discussions.value.map(discussion => {
      if (Number(discussion.id) !== discussionId) return discussion

      const lastReadPostNumber = Math.max(
        Number(discussion.last_read_post_number || 0),
        Number(detail.lastReadPostNumber || 0)
      )
      const unreadCount = Math.max(Number(detail.unreadCount || 0), 0)

      return {
        ...discussion,
        last_read_post_number: lastReadPostNumber,
        last_read_at: detail.lastReadAt || discussion.last_read_at,
        unread_count: unreadCount,
        is_unread: unreadCount > 0
      }
    })
  }

  function handleStartDiscussion() {
    startDiscussion({
      tagId: currentTag.value?.id,
      source: route.name?.toString() || 'index'
    })
  }

  function buildSidebarPrimaryTagItems(sourceTags, contextParent) {
    return sortForumSidebarTags(flattenTags(sourceTags)).filter(tag => {
      const position = normalizeTagPosition(tag.position)
      if (position === null) return false
      if (!tag.parent_id) return true
      return Boolean(contextParent && tag.parent_id === contextParent.id)
    })
  }

  function buildSidebarSecondaryTagItems(sourceTags) {
    return sortForumSidebarTags(flattenTags(sourceTags))
      .filter(tag => normalizeTagPosition(tag.position) === null)
      .slice(0, 3)
  }

  function sortForumSidebarTags(sourceTags) {
    const normalizedTags = unwrapList(sourceTags).map(normalizeTag)
    const tagsById = new Map(normalizedTags.map(tag => [tag.id, tag]))

    return normalizedTags.slice().sort((left, right) => {
      const leftPosition = normalizeTagPosition(left.position)
      const rightPosition = normalizeTagPosition(right.position)

      if (leftPosition === null && rightPosition === null) {
        return Number(right.discussion_count || 0) - Number(left.discussion_count || 0)
      }

      if (rightPosition === null) return -1
      if (leftPosition === null) return 1

      const leftParent = left.parent_id ? tagsById.get(left.parent_id) : null
      const rightParent = right.parent_id ? tagsById.get(right.parent_id) : null

      if (leftParent?.id === rightParent?.id) return leftPosition - rightPosition

      if (leftParent && rightParent) {
        return normalizeTagPosition(leftParent.position) - normalizeTagPosition(rightParent.position)
      }

      if (leftParent) {
        return leftParent.id === right.id
          ? 1
          : normalizeTagPosition(leftParent.position) - rightPosition
      }

      if (rightParent) {
        return rightParent.id === left.id
          ? -1
          : leftPosition - normalizeTagPosition(rightParent.position)
      }

      return 0
    })
  }

  function findSidebarContextParent(targetSlug, sourceTags) {
    if (!targetSlug) return null

    for (const tag of unwrapList(sourceTags).map(normalizeTag)) {
      if (tag.slug === targetSlug) return tag

      if (flattenTags(tag.children).some(child => child.slug === targetSlug)) {
        return tag
      }
    }

    return null
  }

  function normalizeTagPosition(position) {
    return position === null || position === undefined ? null : Number(position)
  }

  function getSidebarTagStyle(tag) {
    return {
      '--tag-color': tag.color || '#6c7a89'
    }
  }

  function getStartDiscussionButtonStyle(tag) {
    if (!tag?.color) return {}

    return {
      '--tag-button-bg': tag.color,
      '--tag-button-text': getContrastColor(tag.color)
    }
  }

  function getContrastColor(color) {
    const hex = String(color || '').trim().replace('#', '')
    if (!/^[\da-fA-F]{6}$/.test(hex)) return '#ffffff'

    const red = parseInt(hex.slice(0, 2), 16)
    const green = parseInt(hex.slice(2, 4), 16)
    const blue = parseInt(hex.slice(4, 6), 16)
    const brightness = (red * 299 + green * 587 + blue * 114) / 1000

    return brightness >= 150 ? '#243447' : '#ffffff'
  }

  function findParentTagSlug(targetSlug, sourceTags) {
    const parent = findSidebarContextParent(targetSlug, sourceTags)
    return parent?.slug || null
  }

  function isSidebarTagActive(tag) {
    if (currentTagSlug.value === tag.slug) return true

    const currentTagParentSlug = findParentTagSlug(currentTagSlug.value, tags.value)
    return Boolean(currentTag.value?.parent_id && currentTagParentSlug === tag.slug)
  }

  return {
    discussions,
    currentTag,
    loading,
    loadingMore,
    sortBy,
    markingAllRead,
    hasMore,
    isFollowingPage,
    isTagsPage,
    isAllDiscussionsPage,
    isOwnProfilePage,
    sidebarPrimaryTagItems,
    sidebarSecondaryTagItems,
    hasSidebarTagNavigation,
    showMoreTagsLink,
    startDiscussionButtonStyle,
    emptyStateText,
    refreshPageData,
    changeSortBy,
    loadMore,
    markAllAsRead,
    handleStartDiscussion,
    getSidebarTagStyle,
    isSidebarTagActive
  }
}
