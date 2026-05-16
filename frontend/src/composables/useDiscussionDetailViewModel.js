import { computed, watch } from 'vue'
import { getDiscussionBadges, getPageState, getUiCopy } from '@/forum/registry'
import { getPostTypeDefinition } from '@/forum/postTypes'
import { useDiscussionDetailInteractions } from '@/composables/useDiscussionDetailInteractions'
import { useDiscussionDetailMenus } from '@/composables/useDiscussionDetailMenus'
import { useDiscussionDetailPage } from '@/composables/useDiscussionDetailPage'
import { useDiscussionDetailPresentation } from '@/composables/useDiscussionDetailPresentation'

export function useDiscussionDetailViewModel({
  authStore,
  composerStore,
  forumStore,
  modalStore,
  route,
  router,
}) {
  const pageState = useDiscussionDetailPage({
    authStore,
    composerStore,
    route,
    router,
  })

  const {
    activePostMenuId,
    closePostMenu,
    discussion,
    hasActiveComposer,
    patchDiscussion,
    posts,
    refreshDiscussion,
    removePost,
    scrollToPost,
    totalPosts,
    upsertPost,
    ...pageBindings
  } = pageState

  const interactions = useDiscussionDetailInteractions({
    authStore,
    composerStore,
    discussion,
    hasActiveComposer,
    modalStore,
    patchDiscussion,
    refreshDiscussion,
    removePost,
    route,
    router,
    scrollToPost,
    totalPosts,
    upsertPost
  })

  const presentation = useDiscussionDetailPresentation(discussion)

  const menus = useDiscussionDetailMenus({
    activePostMenuId,
    authStore,
    canDeletePost: interactions.canDeletePost,
    canEditPost: interactions.canEditPost,
    canModeratePostVisibility: interactions.canModeratePostVisibility,
    canReportPost: interactions.canReportPost,
    canEditDiscussion: interactions.canEditDiscussion,
    canModerateDiscussionSettings: interactions.canModerateDiscussionSettings,
    canReplyFromMenu: interactions.canReplyFromMenu,
    discussion,
    hasActiveComposer,
    isSuspended: interactions.isSuspended,
    modalStore,
    showDiscussionMenu: pageState.showDiscussionMenu,
    discussionActionHandlers: interactions.discussionActionHandlers,
    postActionHandlers: interactions.postActionHandlers,
    togglingSubscription: interactions.togglingSubscription,
  })

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
      loading: pageState.loading.value,
      discussion: discussion.value,
    })

    return pageStateResult?.text || '加载中...'
  })

  const missingStateText = computed(() => {
    const pageStateResult = getPageState({
      surface: 'discussion-detail-not-found',
      loading: pageState.loading.value,
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

  function resolvePostComponent(post) {
    return getPostTypeDefinition(post?.type)?.component
  }

  watch(
    discussion,
    value => {
      if (!value) return
      const firstPostText = String(value.first_post?.content || value.excerpt || '').replace(/\s+/g, ' ').trim()
      forumStore.setPageMeta({
        title: value.title,
        description: firstPostText.slice(0, 160),
        ogType: 'article',
        canonicalUrl: `/d/${value.id}`,
      })
    },
    { immediate: true }
  )

  return {
    ...pageBindings,
    ...interactions,
    ...presentation,
    ...menus,
    activePostMenuId,
    closePostMenu,
    discussion,
    discussionBadges,
    hasActiveComposer,
    loadMoreText,
    loadPreviousText,
    loadingPostsText,
    loadingStateText,
    missingStateText,
    resolvePostComponent,
    unreadDividerText,
  }
}
