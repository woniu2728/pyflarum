import { useStartDiscussionAction } from '@/composables/useStartDiscussionAction'
import { useDiscussionListPageActions } from '@/composables/useDiscussionListPageActions'
import { useDiscussionListPageState } from '@/composables/useDiscussionListPageState'

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
  const pageState = useDiscussionListPageState({
    authStore,
    modalStore,
    route,
    router,
  })
  const pageActions = useDiscussionListPageActions({
    currentTag: pageState.currentTag,
    route,
    startDiscussion,
  })

  return {
    ...pageState,
    handleStartDiscussion: pageActions.handleStartDiscussion,
  }
}
