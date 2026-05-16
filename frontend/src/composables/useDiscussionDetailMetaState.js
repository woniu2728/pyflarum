import { computed, watch } from 'vue'
import { getDiscussionBadges, getPageState, getUiCopy } from '@/forum/registry'
import { resolveDiscussionDetailMetaPayload } from '@/utils/discussionDetailMeta'

export function useDiscussionDetailMetaState({
  discussion,
  forumStore,
  loading,
}) {
  const discussionBadges = computed(() => {
    if (!discussion.value) return []

    return getDiscussionBadges({
      discussion: discussion.value,
      surface: 'hero',
    })
  })

  const loadingStateText = computed(() => {
    const pageStateResult = getPageState({
      surface: 'discussion-detail-loading',
      loading: loading.value,
      discussion: discussion.value,
    })

    return pageStateResult?.text || '加载中...'
  })

  const missingStateText = computed(() => {
    const pageStateResult = getPageState({
      surface: 'discussion-detail-not-found',
      loading: loading.value,
      discussion: discussion.value,
    })

    return pageStateResult?.text || '讨论不存在'
  })

  const loadPreviousText = computed(() => getUiCopy({
    surface: 'discussion-detail-load-previous',
  })?.text || '加载前面的回复')

  const loadMoreText = computed(() => getUiCopy({
    surface: 'discussion-detail-load-more',
  })?.text || '加载更多回复')

  const loadingPostsText = computed(() => getUiCopy({
    surface: 'discussion-detail-load-posts-loading',
  })?.text || '正在加载回复...')

  const unreadDividerText = computed(() => getUiCopy({
    surface: 'discussion-detail-unread-divider',
  })?.text || '从这里开始是未读回复')

  watch(
    discussion,
    value => {
      const metaPayload = resolveDiscussionDetailMetaPayload(value)
      if (!metaPayload) return
      forumStore.setPageMeta(metaPayload)
    },
    { immediate: true }
  )

  return {
    discussionBadges,
    loadMoreText,
    loadPreviousText,
    loadingPostsText,
    loadingStateText,
    missingStateText,
    unreadDividerText,
  }
}
