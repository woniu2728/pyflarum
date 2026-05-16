import { useDiscussionDetailMetaState } from '@/composables/useDiscussionDetailMetaState'
import { useDiscussionDetailPage } from '@/composables/useDiscussionDetailPage'
import { useDiscussionDetailPresentationState } from '@/composables/useDiscussionDetailPresentationState'

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
    discussionMobileNavRef,
    hasActiveComposer,
    patchDiscussion,
    refreshDiscussion,
    removePost,
    scrollToPost,
    totalPosts,
    upsertPost,
    ...pageBindings
  } = pageState
  const presentationState = useDiscussionDetailPresentationState({
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
  })
  const metaState = useDiscussionDetailMetaState({
    discussion,
    forumStore,
    loading: pageState.loading,
  })

  return {
    ...pageBindings,
    ...metaState,
    ...presentationState,
  }
}
