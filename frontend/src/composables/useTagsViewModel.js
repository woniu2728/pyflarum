import { computed } from 'vue'
import { useTagsPage } from '@/composables/useTagsPage'
import { useTagsMetaState } from '@/composables/useTagsMetaState'
import { useStartDiscussionAction } from '@/composables/useStartDiscussionAction'

export function useTagsViewModel({
  authStore,
  composerStore,
  forumStore,
  pageState: injectedPageState,
  router,
}) {
  const pageState = injectedPageState || useTagsPage()
  const { startDiscussion } = useStartDiscussionAction({
    authStore,
    composerStore,
    router,
  })
  const metaState = useTagsMetaState({
    forumStore,
    loading: pageState.loading,
    tags: pageState.tags,
  })

  const showStartDiscussionButton = computed(() => {
    return !authStore.isAuthenticated || authStore.canStartDiscussion
  })

  function handleStartDiscussion() {
    startDiscussion({
      source: 'tags',
    })
  }

  return {
    ...pageState,
    ...metaState,
    handleStartDiscussion,
    showStartDiscussionButton,
  }
}
