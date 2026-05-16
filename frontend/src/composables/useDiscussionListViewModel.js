import { useDiscussionListMetaState } from '@/composables/useDiscussionListMetaState'
import { useDiscussionListPage } from '@/composables/useDiscussionListPage'

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

  return {
    ...pageState,
    ...metaState,
  }
}
