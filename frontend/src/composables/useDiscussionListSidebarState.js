import { computed } from 'vue'
import { getUiCopy } from '../forum/frontendRegistry.js'

export function createDiscussionListSidebarState({
  authStore,
  getText = getUiCopy,
}) {
  const showStartDiscussionButton = computed(() => {
    if (authStore.value?.isRestoringSession && authStore.value?.isAuthenticated && !authStore.value?.user) {
      return false
    }

    return !authStore.value?.isAuthenticated || authStore.value?.canStartDiscussion
  })

  const showProfileLink = computed(() => Boolean(authStore.value?.user))

  const profileLinkLabel = computed(() => getText({
    surface: 'discussion-list-sidebar-profile-link',
  })?.text || '我的主页')

  const tagsLinkLabel = computed(() => getText({
    surface: 'discussion-list-sidebar-tags-link',
  })?.text || '标签')

  const moreTagsLinkLabel = computed(() => getText({
    surface: 'discussion-list-sidebar-more-tags-link',
  })?.text || '更多标签')

  return {
    moreTagsLinkLabel,
    profileLinkLabel,
    showProfileLink,
    showStartDiscussionButton,
    tagsLinkLabel,
  }
}

export function useDiscussionListSidebarState(options) {
  return createDiscussionListSidebarState(options)
}
