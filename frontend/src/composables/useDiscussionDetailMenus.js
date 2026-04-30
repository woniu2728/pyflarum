export function useDiscussionDetailMenus({
  activePostMenuId,
  canDeletePost,
  canEditPost,
  canReportPost,
  deleteDiscussion,
  editDiscussion,
  goToLoginForReply,
  openComposer,
  openReportModal,
  showDiscussionMenu,
  toggleHide,
  toggleLock,
  togglePin,
  toggleSubscription
}) {
  async function handleDiscussionMenuSelection(action) {
    const actionMap = {
      reply: openComposer,
      login: goToLoginForReply,
      'toggle-subscription': toggleSubscription,
      edit: editDiscussion,
      'toggle-pin': togglePin,
      'toggle-lock': toggleLock,
      'toggle-hide': toggleHide,
      delete: deleteDiscussion
    }
    const handler = actionMap[action]
    if (!handler) return

    showDiscussionMenu.value = false
    await handler()
  }

  function hasPostControls(post) {
    return canEditPost(post) || canDeletePost(post) || canReportPost(post)
  }

  async function handleOpenReportModal(post) {
    activePostMenuId.value = null
    await openReportModal(post)
  }

  return {
    handleDiscussionMenuSelection,
    hasPostControls,
    handleOpenReportModal
  }
}
