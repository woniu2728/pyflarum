import { useDiscussionDetailModerationActions } from '@/composables/useDiscussionDetailModerationActions'
import { createDiscussionActionHandlers, createPostActionHandlers } from '@/composables/discussionDetailActionHandlers'
import { useDiscussionDetailUserActions } from '@/composables/useDiscussionDetailUserActions'

export function useDiscussionDetailInteractions({
  authStore,
  canEditDiscussion,
  canLikePost,
  canModeratePendingDiscussion,
  canModeratePendingPost,
  canModeratePostVisibility,
  composerStore,
  discussion,
  formatAbsoluteDate,
  hasActiveComposer,
  isSuspended,
  modalStore,
  patchDiscussion,
  refreshDiscussion,
  removePost,
  route,
  router,
  suspensionNotice,
  totalPosts,
  upsertPost
}) {
  const userActions = useDiscussionDetailUserActions({
    authStore,
    canEditDiscussion,
    canLikePost,
    composerStore,
    discussion,
    hasActiveComposer,
    isSuspended,
    modalStore,
    patchDiscussion,
    refreshDiscussion,
    removePost,
    route,
    router,
    suspensionNotice,
    totalPosts,
  })

  const moderationActions = useDiscussionDetailModerationActions({
    authStore,
    canModeratePendingDiscussion,
    canModeratePendingPost,
    canModeratePostVisibility,
    discussion,
    isSuspended,
    modalStore,
    patchDiscussion,
    refreshDiscussion,
    router,
    showActionError: userActions.showActionError,
    showSuspensionAlert: userActions.showSuspensionAlert,
    uiText: userActions.uiText,
    upsertPost,
  })
  const discussionActionHandlers = createDiscussionActionHandlers({
    deleteDiscussion: moderationActions.deleteDiscussion,
    editDiscussion: userActions.editDiscussion,
    goToLoginForReply: userActions.goToLoginForReply,
    openComposer: userActions.openComposer,
    shareDiscussion: userActions.shareDiscussion,
    toggleHide: moderationActions.toggleHide,
    toggleLock: moderationActions.toggleLock,
    togglePin: moderationActions.togglePin,
    toggleSubscription: moderationActions.toggleSubscription,
  })
  const postActionHandlers = createPostActionHandlers({
    deletePost: userActions.deletePost,
    editPost: userActions.editPost,
    openReportModal: userActions.openReportModal,
    togglePostHidden: moderationActions.togglePostHidden,
  })

  return {
    formatAbsoluteDate,
    formatDate: userActions.formatDate,
    formatLikeSummary: userActions.formatLikeSummary,
    goToLoginForReply: userActions.goToLoginForReply,
    isSuspended,
    likePendingPostIds: userActions.likePendingPostIds,
    openComposer: userActions.openComposer,
    openReportModal: userActions.openReportModal,
    postActionHandlers,
    replyToPost: userActions.replyToPost,
    shareDiscussion: userActions.shareDiscussion,
    discussionActionHandlers,
    showSuspensionAlert: userActions.showSuspensionAlert,
    suspensionNotice,
    toggleLike: userActions.toggleLike,
    ...moderationActions,
    ...userActions,
  }
}
