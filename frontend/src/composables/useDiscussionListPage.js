import { useStartDiscussionAction } from '@/composables/useStartDiscussionAction'
import { useDiscussionListData } from '@/composables/useDiscussionListData'
import { useDiscussionListNavigation } from '@/composables/useDiscussionListNavigation'

export function useDiscussionListPage({
  authStore,
  composerStore,
  modalStore,
  route,
  router
}) {
  const { startDiscussion } = useStartDiscussionAction({
    authStore,
    composerStore,
    router
  })
  const {
    discussions,
    currentTag,
    currentTagSlug,
    loading,
    loadingMore,
    sortBy,
    markingAllRead,
    hasMore,
    isFollowingPage,
    tags,
    refreshPageData,
    changeSortBy,
    loadMore,
    markAllAsRead
  } = useDiscussionListData({
    authStore,
    modalStore,
    route
  })
  const {
    isTagsPage,
    isAllDiscussionsPage,
    isOwnProfilePage,
    sidebarPrimaryTagItems,
    sidebarSecondaryTagItems,
    hasSidebarTagNavigation,
    showMoreTagsLink,
    startDiscussionButtonStyle,
    emptyStateText,
    getSidebarTagStyle,
    isSidebarTagActive
  } = useDiscussionListNavigation({
    authStore,
    currentTag,
    currentTagSlug,
    isFollowingPage,
    route,
    tags
  })

  function handleStartDiscussion() {
    startDiscussion({
      tagId: currentTag.value?.id,
      source: route.name?.toString() || 'index'
    })
  }

  return {
    discussions,
    currentTag,
    loading,
    loadingMore,
    sortBy,
    markingAllRead,
    hasMore,
    isFollowingPage,
    isTagsPage,
    isAllDiscussionsPage,
    isOwnProfilePage,
    sidebarPrimaryTagItems,
    sidebarSecondaryTagItems,
    hasSidebarTagNavigation,
    showMoreTagsLink,
    startDiscussionButtonStyle,
    emptyStateText,
    refreshPageData,
    changeSortBy,
    loadMore,
    markAllAsRead,
    handleStartDiscussion,
    getSidebarTagStyle,
    isSidebarTagActive
  }
}
