import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import api from '@/api'
import { useForumRealtimeStore } from '@/stores/forumRealtime'
import { useResourceStore } from '@/stores/resource'
import { flattenTags, normalizeTag, unwrapList } from '@/utils/forum'
import {
  FORUM_REALTIME_REFRESH_EVENT_TYPES,
  getTrackedDiscussionIdsFromDiscussionItems,
  hasTrackedDiscussionId,
} from '@/utils/forumRealtime'

export function useTagsPage() {
  const forumRealtimeStore = useForumRealtimeStore()
  const resourceStore = useResourceStore()
  const tagIds = ref([])
  const loading = ref(true)
  const tags = computed(() => resourceStore.list('tags', tagIds.value))
  const trackedDiscussionIds = computed(() => {
    return getTrackedDiscussionIdsFromDiscussionItems(
      tags.value
        .map(tag => tag?.last_posted_discussion)
        .filter(Boolean)
    )
  })

  const cloudTags = computed(() => flattenTags(tags.value.filter(tag => tag.children.length === 0)).slice(0, 12))

  onMounted(async () => {
    await loadTags()
    window.addEventListener('bias:forum-event', handleForumEvent)
  })

  watch(
    () => trackedDiscussionIds.value,
    (nextTrackedIds, previousTrackedIds = []) => {
      forumRealtimeStore.untrackDiscussionIds(previousTrackedIds)
      forumRealtimeStore.trackDiscussionIds(nextTrackedIds)
    }
  )

  onBeforeUnmount(() => {
    forumRealtimeStore.untrackDiscussionIds(trackedDiscussionIds.value)
    window.removeEventListener('bias:forum-event', handleForumEvent)
  })

  async function loadTags() {
    loading.value = true
    try {
      const response = await api.get('/tags', {
        params: {
          include_children: true
        }
      })
      tagIds.value = resourceStore.upsertMany('tags', unwrapList(response).map(normalizeTag))
        .map(item => item.id)
    } catch (error) {
      console.error('加载标签失败:', error)
    } finally {
      loading.value = false
    }
  }

  async function handleForumEvent(event) {
    const detail = event.detail || {}
    const discussionId = Number(detail.discussion_id)
    if (!hasTrackedDiscussionId(trackedDiscussionIds.value, discussionId)) {
      return
    }

    if (FORUM_REALTIME_REFRESH_EVENT_TYPES.has(detail.event_type)) {
      await loadTags()
      return
    }

    const payload = detail.payload || {}
    resourceStore.mergePayload(payload)
  }

  return {
    cloudTags,
    loading,
    tags
  }
}
