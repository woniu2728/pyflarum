import { useDiscussionDetailMetaState } from '@/composables/useDiscussionDetailMetaState'
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
  const metaState = useDiscussionDetailMetaState({
    discussion,
    forumStore,
    loading: pageState.loading,
  })

  function resolvePostComponent(post) {
    return getPostTypeDefinition(post?.type)?.component
  }

  return {
    ...pageBindings,
    ...interactions,
    ...metaState,
    ...presentation,
    ...menus,
    activePostMenuId,
    closePostMenu,
    discussion,
    hasActiveComposer,
    resolvePostComponent,
  }
}
