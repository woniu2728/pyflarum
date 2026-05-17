import { computed } from 'vue'
import { getUiCopy } from '@/forum/registry'
import { useDiscussionCreatePage } from '@/composables/useDiscussionCreatePage'
import { useDiscussionCreateViewBindings } from '@/composables/useDiscussionCreateViewBindings'
import { useStartDiscussionAction } from '@/composables/useStartDiscussionAction'

export function useDiscussionCreateViewModel({
  authStore,
  composerStore,
  pageState: injectedPageState,
  route,
  router,
}) {
  const { startDiscussion } = useStartDiscussionAction({
    authStore,
    composerStore,
    router,
  })
  const pageState = injectedPageState || useDiscussionCreatePage({
    route,
    router,
    startDiscussion,
  })

  const titleText = computed(() => {
    return getUiCopy({
      surface: 'discussion-create-title',
    })?.text || '正在打开讨论编辑器...'
  })

  const descriptionText = computed(() => {
    return getUiCopy({
      surface: 'discussion-create-description',
    })?.text || '系统会自动切换到浮层编辑器。'
  })

  const viewBindings = useDiscussionCreateViewBindings({
    descriptionText,
    titleText,
  })

  return {
    ...pageState,
    ...viewBindings,
    descriptionText,
    titleText,
  }
}
