import { useDiscussionListMetaState } from '@/composables/useDiscussionListMetaState'
import { useDiscussionListPage } from '@/composables/useDiscussionListPage'
import { useDiscussionListViewBindings } from '@/composables/useDiscussionListViewBindings'
import {
  buildDiscussionPath,
  buildTagPath,
  buildUserPath,
  formatRelativeTime,
  getUserAvatarColor,
  getUserDisplayName,
  getUserInitial,
} from '@/utils/forum'

export function useDiscussionListViewModel({
  authStore,
  composerStore,
  forumStore,
  modalStore,
  pageState: injectedPageState,
  route,
  router,
}) {
  const pageState = injectedPageState || useDiscussionListPage({
    authStore,
    composerStore,
    modalStore,
    route,
    router
  })
  const metaState = useDiscussionListMetaState({
    currentTag: pageState.currentTag,
    forumStore,
    isFollowingPage: pageState.isFollowingPage,
    listFilter: pageState.listFilter,
    route,
    searchQuery: pageState.searchQuery,
  })
  const viewBindings = useDiscussionListViewBindings({
    authStore,
    buildDiscussionPath,
    buildTagPath,
    buildUserPath,
    changeSortBy: pageState.changeSortBy,
    currentTag: pageState.currentTag,
    discussions: pageState.discussions,
    emptyStateText: metaState.emptyStateText,
    formatRelativeTime,
    getSidebarTagStyle: pageState.getSidebarTagStyle,
    getUserAvatarColor,
    getUserDisplayName,
    getUserInitial,
    handleStartDiscussion: pageState.handleStartDiscussion,
    hasMore: pageState.hasMore,
    hasSidebarTagNavigation: pageState.hasSidebarTagNavigation,
    isFollowingPage: pageState.isFollowingPage,
    isOwnProfilePage: pageState.isOwnProfilePage,
    isSidebarTagActive: pageState.isSidebarTagActive,
    isTagsPage: pageState.isTagsPage,
    loading: pageState.loading,
    loadingMore: pageState.loadingMore,
    loadingStateText: metaState.loadingStateText,
    loadMore: pageState.loadMore,
    markingAllRead: pageState.markingAllRead,
    markAllAsRead: pageState.markAllAsRead,
    refreshDiscussionList: pageState.refreshDiscussionList,
    refreshing: pageState.refreshing,
    showMoreTagsLink: pageState.showMoreTagsLink,
    sidebarFilterItems: pageState.sidebarFilterItems,
    sidebarPrimaryTagItems: pageState.sidebarPrimaryTagItems,
    sidebarSecondaryTagItems: pageState.sidebarSecondaryTagItems,
    sortBy: pageState.sortBy,
    sortOptions: pageState.sortOptions,
    startDiscussionButtonStyle: pageState.startDiscussionButtonStyle,
  })

  return {
    ...pageState,
    ...metaState,
    ...viewBindings,
  }
}
