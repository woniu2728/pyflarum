import { computed, ref } from 'vue'
import api from '@/api'
import { useResourceStore } from '@/stores/resource'
import { normalizeDiscussion, normalizeTag, unwrapList } from '@/utils/forum'

export function useDiscussionListResourceState({
  currentTagSlug,
  isFollowingPage,
  listFilter,
  searchQuery,
  sortBy,
}) {
  const resourceStore = useResourceStore()
  const discussionIds = ref([])
  const tagIds = ref([])
  const currentTagId = ref(null)
  const sortOptions = ref([])
  const filterOptions = ref([])
  const currentPage = ref(1)
  const total = ref(0)
  const pageSize = 20

  const discussions = computed(() => resourceStore.list('discussions', discussionIds.value))
  const tags = computed(() => resourceStore.list('tags', tagIds.value))
  const currentTag = computed(() => (currentTagId.value ? resourceStore.get('tags', currentTagId.value) : null))
  const hasMore = computed(() => currentPage.value * pageSize < total.value)

  function reset() {
    discussionIds.value = []
    currentTagId.value = null
    currentPage.value = 1
    total.value = 0
  }

  async function loadInitialResources() {
    await Promise.all([loadTags(), loadCurrentTag(), loadDiscussions({ append: false })])
  }

  async function loadMoreDiscussions() {
    currentPage.value += 1
    try {
      await loadDiscussions({ append: true })
    } catch (error) {
      currentPage.value = Math.max(1, currentPage.value - 1)
      throw error
    }
  }

  async function refreshDiscussions() {
    await loadDiscussions({ append: false })
  }

  async function loadTags() {
    const response = await api.get('/tags', {
      params: {
        include_children: true
      }
    })
    tagIds.value = unwrapList(response)
      .map(normalizeTag)
      .map(item => resourceStore.upsert('tags', item).id)
  }

  async function loadCurrentTag() {
    if (!currentTagSlug.value || isFollowingPage.value) {
      currentTagId.value = null
      return
    }

    try {
      const response = await api.get(`/tags/slug/${currentTagSlug.value}`)
      const tag = resourceStore.upsert('tags', normalizeTag(response))
      currentTagId.value = tag.id
    } catch (error) {
      currentTagId.value = null
      console.error('加载标签详情失败:', error)
    }
  }

  async function loadDiscussions({ append }) {
    const response = await api.get('/discussions/', {
      params: {
        page: currentPage.value,
        limit: pageSize,
        sort: sortBy.value,
        filter: listFilter.value,
        q: searchQuery.value || undefined,
        tag: currentTagSlug.value || undefined,
      }
    })

    const items = unwrapList(response).map(normalizeDiscussion)
    const ids = items.map(item => resourceStore.upsert('discussions', item).id)

    discussionIds.value = append
      ? [...discussionIds.value, ...ids]
      : ids

    total.value = response.total || items.length
    sortOptions.value = Array.isArray(response.available_sorts) ? response.available_sorts : []
    filterOptions.value = Array.isArray(response.available_filters) ? response.available_filters : []
  }

  return {
    currentPage,
    currentTag,
    currentTagId,
    discussionIds,
    discussions,
    filterOptions,
    hasMore,
    loadInitialResources,
    loadMoreDiscussions,
    refreshDiscussions,
    reset,
    sortOptions,
    tagIds,
    tags,
    total,
  }
}
