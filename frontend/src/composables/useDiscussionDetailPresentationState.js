import { getPostTypeDefinition } from '@/forum/postTypes'
import { useDiscussionDetailInteractions } from '@/composables/useDiscussionDetailInteractions'
import { useDiscussionDetailMenus } from '@/composables/useDiscussionDetailMenus'
import { useDiscussionDetailPresentation } from '@/composables/useDiscussionDetailPresentation'

export function useDiscussionDetailPresentationState({
  activePostMenuId,
  authStore,
  closePostMenu,
  composerStore,
  discussion,
  discussionMobileNavRef,
  hasActiveComposer,
  modalStore,
  pageState,
  patchDiscussion,
  refreshDiscussion,
  removePost,
  route,
  router,
  scrollToPost,
  totalPosts,
  upsertPost,
}) {
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

  function resolvePostComponent(post) {
    return getPostTypeDefinition(post?.type)?.component
  }

  return {
    ...interactions,
    ...menus,
    ...presentation,
    activePostMenuId,
    closePostMenu,
    discussion,
    discussionMobileNavRef,
    hasActiveComposer,
    resolvePostComponent,
  }
}
