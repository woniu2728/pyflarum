import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import api from '@/api'
import { useForumRealtimeStore } from '@/stores/forumRealtime'
import { useResourceStore } from '@/stores/resource'
import {
  normalizePost,
  unwrapList,
} from '@/utils/forum'
import {
  mergeForumEventPayload,
  shouldRefreshForumEvent,
} from '@/utils/forumRealtime'
import { useDiscussionNearRouteState } from './useDiscussionNearRouteState'

export function useDiscussionPostStreamState({
  authStore,
  discussion,
  discussionId,
  route,
  router,
  patchDiscussion,
  refreshDiscussion,
}) {
  const resourceStore = useResourceStore()
  const forumRealtimeStore = useForumRealtimeStore()
  const nearRouteState = useDiscussionNearRouteState({ route, router })
  const postIds = ref([])
  const posts = computed(() => resourceStore.list('posts', postIds.value))
  const loading = ref(true)
  const loadingMore = ref(false)
  const loadingPrevious = ref(false)
  const firstLoadedPage = ref(1)
  const lastLoadedPage = ref(1)
  const totalPosts = ref(0)
  const highlightedPostNumber = ref(null)
  const currentVisiblePostNumber = ref(1)
  const currentVisiblePostProgress = ref(1)
  const pageLimit = 20

  let nearUrlTimer = null
  let readStateTimer = null
  let lastReportedReadNumber = 0

  const targetNearPost = nearRouteState.near
  const hasPrevious = computed(() => firstLoadedPage.value > 1)
  const hasMore = computed(() => totalPosts.value > 0 && lastLoadedPage.value * pageLimit < totalPosts.value)
  const maxPostNumber = computed(() => {
    return discussion.value?.last_post_number || discussion.value?.comment_count || 1
  })
  const unreadCount = computed(() => {
    return Math.max(Number(discussion.value?.unread_count || 0), 0)
  })
  const unreadStartPostNumber = computed(() => {
    if (!unreadCount.value) return null

    const lastRead = Number(discussion.value?.last_read_post_number || 0)
    return Math.min(maxPostNumber.value, Math.max(1, lastRead + 1))
  })

  onMounted(() => {
    window.addEventListener('bias:reply-created', handleReplyCreated)
    window.addEventListener('bias:post-updated', handlePostUpdated)
    window.addEventListener('bias:discussion-updated', handleDiscussionUpdated)
    window.addEventListener('bias:forum-event', handleForumEvent)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('bias:reply-created', handleReplyCreated)
    window.removeEventListener('bias:post-updated', handlePostUpdated)
    window.removeEventListener('bias:discussion-updated', handleDiscussionUpdated)
    window.removeEventListener('bias:forum-event', handleForumEvent)
    if (discussionId.value) {
      forumRealtimeStore.untrackDiscussionIds([discussionId.value])
    }
    if (nearUrlTimer) {
      clearTimeout(nearUrlTimer)
    }
    if (readStateTimer) {
      clearTimeout(readStateTimer)
    }
  })

  watch(
    discussionId,
    (nextId, previousId) => {
      if (previousId) {
        forumRealtimeStore.untrackDiscussionIds([previousId])
      }
      if (nextId) {
        forumRealtimeStore.trackDiscussionIds([nextId])
      }
    }
  )

  async function refreshPostStream(options = {}) {
    const keepLoading = Boolean(options.keepLoading)
    loading.value = !keepLoading
    try {
      await loadInitialPosts()
    } finally {
      loading.value = false
    }
  }

  async function loadInitialPosts() {
    const data = await fetchPosts(1, targetNearPost.value)
    replacePosts(data)

    if (targetNearPost.value) {
      await scrollToPost(targetNearPost.value)
    }
  }

  async function fetchPosts(page, near = null) {
    const params = {
      page,
      limit: pageLimit,
    }

    if (near) {
      params.near = near
    }

    return api.get(`/discussions/${route.params.id}/posts`, { params })
  }

  function replacePosts(data) {
    const items = unwrapList(data).map(normalizePost)
    postIds.value = collectPostIds(items)
    firstLoadedPage.value = data.page || 1
    lastLoadedPage.value = data.page || 1
    totalPosts.value = data.total || items.length
  }

  function appendPosts(data) {
    const items = unwrapList(data).map(normalizePost)
    mergePostIds(collectPostIds(items))
    lastLoadedPage.value = data.page || lastLoadedPage.value + 1
    totalPosts.value = data.total || totalPosts.value
  }

  function prependPosts(data) {
    const items = unwrapList(data).map(normalizePost)
    mergePostIds(collectPostIds(items), { prepend: true })
    firstLoadedPage.value = data.page || Math.max(1, firstLoadedPage.value - 1)
    totalPosts.value = data.total || totalPosts.value
  }

  async function loadMorePosts() {
    loadingMore.value = true
    try {
      const data = await fetchPosts(lastLoadedPage.value + 1)
      appendPosts(data)
    } finally {
      loadingMore.value = false
    }
  }

  async function loadPreviousPosts() {
    if (!hasPrevious.value) return

    loadingPrevious.value = true
    try {
      const data = await fetchPosts(firstLoadedPage.value - 1)
      prependPosts(data)
    } finally {
      loadingPrevious.value = false
    }
  }

  async function jumpToPost(number) {
    const targetNumber = normalizePostNumber(number)
    if (!targetNumber) return

    if (posts.value.some(post => post.number === targetNumber)) {
      await scrollToPost(targetNumber)
      replaceNearInAddressBar(targetNumber)
      return
    }

    await nearRouteState.replaceRouteNear(targetNumber)
  }

  async function scrollToPost(number) {
    await nextTick()
    const target = document.getElementById(`post-${number}`)
    if (!target) return

    highlightedPostNumber.value = number
    currentVisiblePostNumber.value = number
    target.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setTimeout(() => {
      if (highlightedPostNumber.value === number) {
        highlightedPostNumber.value = null
      }
    }, 2400)
  }

  function resetPostStream() {
    postIds.value = []
    firstLoadedPage.value = 1
    lastLoadedPage.value = 1
    totalPosts.value = 0
    highlightedPostNumber.value = null
    currentVisiblePostNumber.value = normalizePostNumber(targetNearPost.value) || 1
    currentVisiblePostProgress.value = currentVisiblePostNumber.value
  }

  function collectPostIds(items = []) {
    return items.map(item => resourceStore.upsert('posts', item).id)
  }

  function mergePostIds(ids = [], { prepend = false } = {}) {
    const source = prepend ? [...ids, ...postIds.value] : [...postIds.value, ...ids]
    const seen = new Set()
    postIds.value = source.filter(id => {
      const key = String(id)
      if (seen.has(key)) {
        return false
      }
      seen.add(key)
      return true
    })
  }

  function showUnreadDivider(post) {
    return Boolean(
      authStore.isAuthenticated
      && unreadStartPostNumber.value
      && unreadCount.value > 0
      && Number(post?.number) === Number(unreadStartPostNumber.value)
    )
  }

  function clampPostPosition(value) {
    const parsed = Number(value)
    if (!Number.isFinite(parsed)) return 1
    return Math.min(maxPostNumber.value, Math.max(1, parsed))
  }

  function sanitizePostNumber(value) {
    return Math.floor(clampPostPosition(value))
  }

  function normalizePostNumber(value) {
    return sanitizePostNumber(value)
  }

  function scheduleNearUrlSync(number) {
    if (nearUrlTimer) {
      clearTimeout(nearUrlTimer)
    }

    nearUrlTimer = setTimeout(() => {
      replaceNearInAddressBar(number)
    }, 300)
  }

  function replaceNearInAddressBar(number) {
    nearRouteState.replaceAddressBarNear(number)
  }

  function scheduleReadStateSync(number) {
    if (!authStore.isAuthenticated || !discussion.value) return

    const targetNumber = normalizePostNumber(number)
    const currentRead = Number(discussion.value.last_read_post_number || 0)
    if (targetNumber <= Math.max(currentRead, lastReportedReadNumber)) return

    if (readStateTimer) {
      clearTimeout(readStateTimer)
    }

    readStateTimer = setTimeout(async () => {
      try {
        const data = await api.post(`/discussions/${discussion.value.id}/read`, {
          last_read_post_number: targetNumber,
        })
        if (!discussion.value) return

        lastReportedReadNumber = Number(data.last_read_post_number || targetNumber)
        const unreadCountValue = Math.max((discussion.value.last_post_number || 0) - lastReportedReadNumber, 0)
        patchDiscussion({
          last_read_post_number: lastReportedReadNumber,
          last_read_at: data.last_read_at || discussion.value.last_read_at,
          unread_count: unreadCountValue,
          is_unread: unreadCountValue > 0,
        })
        window.dispatchEvent(new CustomEvent('bias:discussion-read-state-updated', {
          detail: {
            discussionId: discussion.value.id,
            lastReadPostNumber: lastReportedReadNumber,
            lastReadAt: data.last_read_at || discussion.value.last_read_at,
            unreadCount: unreadCountValue,
          },
        }))
      } catch (error) {
        console.error('更新讨论阅读状态失败:', error)
      }
    }, 400)
  }

  async function handleReplyCreated(event) {
    const detail = event.detail || {}
    if (!discussion.value || Number(detail.discussionId) !== Number(discussion.value.id)) return
    if (!detail.post) return

    const newPost = normalizePost(detail.post)
    if (posts.value.some(post => post.id === newPost.id)) return

    const mergedPost = resourceStore.upsert('posts', newPost)
    mergePostIds([mergedPost.id])
    totalPosts.value = Math.max(totalPosts.value + 1, posts.value.length)
    lastLoadedPage.value = Math.max(lastLoadedPage.value, Math.ceil(totalPosts.value / pageLimit))
    lastReportedReadNumber = Math.max(lastReportedReadNumber, newPost.number || 0)
    const lastReadPostNumber = Math.max(Number(discussion.value.last_read_post_number || 0), newPost.number || 0)
    const lastPostNumber = Math.max(discussion.value.last_post_number || 0, newPost.number || 0)
    const unreadCountValue = Math.max(lastPostNumber - lastReadPostNumber, 0)
    patchDiscussion({
      comment_count: (discussion.value.comment_count || 0) + 1,
      last_post_id: newPost.id,
      last_post_number: lastPostNumber,
      last_posted_at: newPost.created_at || discussion.value.last_posted_at,
      last_read_post_number: lastReadPostNumber,
      last_read_at: newPost.created_at || discussion.value.last_read_at,
      unread_count: unreadCountValue,
      is_unread: unreadCountValue > 0,
      ...(authStore.user?.preferences?.follow_after_reply ? { is_subscribed: true } : {}),
    })

    window.dispatchEvent(new CustomEvent('bias:discussion-read-state-updated', {
      detail: {
        discussionId: discussion.value.id,
        lastReadPostNumber,
        lastReadAt: newPost.created_at || discussion.value.last_read_at,
        unreadCount: unreadCountValue,
      },
    }))

    await scrollToPost(newPost.number)
  }

  function applyRealtimeEvent(event) {
    if (!event || Number(event.discussion_id) !== Number(route.params.id)) return

    if (shouldRefreshForumEvent(event.event_type)) {
      refreshDiscussion().catch(error => {
        console.error('刷新讨论详情失败:', error)
      })
      return
    }

    const payload = event.payload || {}
    mergeForumEventPayload(resourceStore, event)

    if (payload.post) {
      const postId = Number(payload.post.id || 0)
      const normalizedPost = postId > 0
        ? resourceStore.get('posts', postId) || normalizePost(payload.post)
        : normalizePost(payload.post)
      switch (event.event_type) {
        case 'post.created':
        case 'post.approved':
        case 'post.resubmitted':
          upsertPost(normalizedPost)
          sortPostIds()
          break
        case 'discussion.created':
        case 'discussion.approved':
        case 'discussion.rejected':
        case 'discussion.resubmitted':
          upsertPost(normalizedPost)
          sortPostIds()
          break
        default:
          upsertPost(normalizedPost)
      }
    }
  }

  function handleForumEvent(event) {
    applyRealtimeEvent(event.detail)
  }

  function handlePostUpdated(event) {
    const detail = event.detail || {}
    if (!discussion.value || Number(detail.discussionId) !== Number(discussion.value.id)) return
    if (!detail.post) return

    upsertPost(detail.post)
  }

  async function handleDiscussionUpdated(event) {
    const detail = event.detail || {}
    if (!discussion.value || Number(detail.discussionId) !== Number(discussion.value.id)) return

    await refreshDiscussion()
  }

  function upsertPost(rawPost) {
    const updatedPost = resourceStore.upsert('posts', normalizePost(rawPost))
    if (!postIds.value.includes(updatedPost.id)) {
      mergePostIds([updatedPost.id])
    }
  }

  function sortPostIds() {
    postIds.value = [...postIds.value].sort((leftId, rightId) => {
      const left = resourceStore.get('posts', leftId)
      const right = resourceStore.get('posts', rightId)
      return Number(left?.number || 0) - Number(right?.number || 0)
    })
  }

  function removePost(postId) {
    postIds.value = postIds.value.filter(id => String(id) !== String(postId))
    resourceStore.remove('posts', postId)
  }

  return {
    currentVisiblePostNumber,
    currentVisiblePostProgress,
    hasMore,
    hasPrevious,
    highlightedPostNumber,
    lastReportedReadNumber,
    loadInitialPosts,
    loadMorePosts,
    loadPreviousPosts,
    loading,
    loadingMore,
    loadingPrevious,
    jumpToPost,
    maxPostNumber,
    normalizePostNumber,
    patchDiscussion,
    postIds,
    posts,
    refreshPostStream,
    removePost,
    replaceNearInAddressBar,
    resetPostStream,
    scheduleNearUrlSync,
    scheduleReadStateSync,
    scrollToPost,
    setCurrentVisiblePostNumber(value) {
      currentVisiblePostNumber.value = value
    },
    setCurrentVisiblePostProgress(value) {
      currentVisiblePostProgress.value = value
    },
    showUnreadDivider,
    totalPosts,
    unreadCount,
    unreadStartPostNumber,
    upsertPost,
  }
}
