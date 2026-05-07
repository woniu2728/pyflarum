import { computed } from 'vue'
import { getDiscussionMenuItems, getPostMenuItems } from '@/forum/discussionActions'

export function useDiscussionDetailMenus({
  activePostMenuId,
  authStore,
  canDeletePost,
  canEditPost,
  canModeratePostVisibility,
  canReportPost,
  canEditDiscussion,
  canModerateDiscussionSettings,
  canReplyFromMenu,
  discussion,
  deleteDiscussion,
  editDiscussion,
  goToLoginForReply,
  hasActiveComposer,
  isSuspended,
  openComposer,
  openReportModal,
  showDiscussionMenu,
  togglingSubscription,
  toggleHide,
  toggleLock,
  togglePin,
  toggleSubscription,
  togglePostHidden,
  deletePost,
  editPost,
  modalStore
}) {
  async function maybeConfirmAction(item) {
    if (!item?.confirm || !modalStore) {
      return true
    }

    return modalStore.confirm({
      cancelText: '取消',
      confirmText: '继续',
      tone: item.tone === 'danger' ? 'danger' : 'primary',
      ...item.confirm,
    })
  }

  async function handleDiscussionMenuSelection(action) {
    const item = discussionMenuItems.value.find(entry => entry.key === action)
    if (!item || item.disabled) return

    const confirmed = await maybeConfirmAction(item)
    if (!confirmed) return

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

  const discussionMenuItems = computed(() => getDiscussionMenuItems({
    authStore,
    canEditDiscussion: canEditDiscussion.value,
    canModerateDiscussionSettings: canModerateDiscussionSettings.value,
    canReplyFromMenu: canReplyFromMenu.value,
    discussion: discussion.value || {},
    hasActiveComposer: hasActiveComposer.value,
    isSuspended: isSuspended.value,
    surface: 'discussion-menu',
    togglingSubscription: togglingSubscription.value
  }))

  const discussionSidebarActionItems = computed(() => getDiscussionMenuItems({
    authStore,
    canEditDiscussion: canEditDiscussion.value,
    canModerateDiscussionSettings: canModerateDiscussionSettings.value,
    canReplyFromMenu: canReplyFromMenu.value,
    discussion: discussion.value || {},
    hasActiveComposer: hasActiveComposer.value,
    isSuspended: isSuspended.value,
    surface: 'discussion-sidebar',
    togglingSubscription: togglingSubscription.value
  }))

  function hasPostControls(post) {
    return getPostMenuOptions(post).length > 0
  }

  function getPostMenuOptions(post) {
    return getPostMenuItems({
      canDeletePost,
      canEditPost,
      canModeratePostVisibility,
      canReportPost,
      post
    })
  }

  async function handleOpenReportModal(post) {
    activePostMenuId.value = null
    await openReportModal(post)
  }

  async function handlePostMenuSelection(post, action) {
    const item = getPostMenuOptions(post).find(entry => entry.key === action)
    if (!item || item.disabled) return

    const confirmed = await maybeConfirmAction(item)
    if (!confirmed) return

    const actionMap = {
      'edit-post': editPost,
      'delete-post': deletePost,
      'toggle-hide-post': togglePostHidden,
      'open-report-modal': handleOpenReportModal,
    }
    const handler = actionMap[action]
    if (!handler) return

    activePostMenuId.value = null
    await handler(post)
  }

  return {
    discussionMenuItems,
    discussionSidebarActionItems,
    getPostMenuOptions,
    handleDiscussionMenuSelection,
    handlePostMenuSelection,
    hasPostControls,
    handleOpenReportModal
  }
}
