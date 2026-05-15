import { computed } from 'vue'
import { runDiscussionAction, runPostAction } from '@/forum/registry'
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
  hasActiveComposer,
  isSuspended,
  showDiscussionMenu,
  togglingSubscription,
  discussionActionHandlers,
  postActionHandlers,
  modalStore
}) {
  async function handleDiscussionMenuSelection(action) {
    const item = discussionMenuItems.value.find(entry => entry.key === action)
    if (!item || item.disabled) return

    const ran = await runDiscussionAction(item, {
      action: item.key,
      authStore,
      discussion: discussion.value || {},
      discussionActionHandlers,
      modalStore,
    })
    if (ran) {
      showDiscussionMenu.value = false
    }
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

  async function handlePostMenuSelection(post, action) {
    const item = getPostMenuOptions(post).find(entry => entry.key === action)
    if (!item || item.disabled) return

    const ran = await runPostAction(item, {
      action: item.key,
      authStore,
      discussion: discussion.value || {},
      modalStore,
      post,
      postActionHandlers,
    })
    if (ran) {
      activePostMenuId.value = null
    }
  }

  return {
    discussionMenuItems,
    discussionSidebarActionItems,
    getPostMenuOptions,
    handleDiscussionMenuSelection,
    handlePostMenuSelection,
    hasPostControls,
  }
}
