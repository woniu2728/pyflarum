import { computed } from 'vue'
import { useTagsPage } from '@/composables/useTagsPage'
import { useTagsMetaState } from '@/composables/useTagsMetaState'
import { useStartDiscussionAction } from '@/composables/useStartDiscussionAction'
import { useTagsViewBindings } from '@/composables/useTagsViewBindings'

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

  const viewBindings = useTagsViewBindings({
    authStore,
    cloudTags: pageState.cloudTags,
    emptyStateText: metaState.emptyStateText,
    handleStartDiscussion,
    heroDescriptionText: metaState.heroDescriptionText,
    heroTitleText: metaState.heroTitleText,
    loading: pageState.loading,
    loadingStateText: metaState.loadingStateText,
    showStartDiscussionButton,
    tags: pageState.tags,
  })

  return {
    ...pageState,
    ...metaState,
    ...viewBindings,
    handleStartDiscussion,
    showStartDiscussionButton,
  }
}
