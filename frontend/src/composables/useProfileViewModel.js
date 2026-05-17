import { useProfilePage } from '@/composables/useProfilePage'
import { useProfileMetaState } from '@/composables/useProfileMetaState'
import { useProfilePanelState } from '@/composables/useProfilePanelState'
import { useProfilePresentation } from '@/composables/useProfilePresentation'
import { getUserAvatarColor } from '@/utils/forum'

export function useProfileViewModel({
  authStore,
  forumStore,
  modalStore,
  pageState: injectedPageState,
  route,
  router,
}) {
  const pageState = injectedPageState || useProfilePage({
    authStore,
    modalStore,
    route,
    router,
  })
  const presentationState = useProfilePresentation(pageState.user)
  const metaState = useProfileMetaState({
    authStore,
    forumStore,
    loading: pageState.loading,
    user: pageState.user,
  })
  const panelState = useProfilePanelState({
    authStore,
    formatDate: presentationState.formatDate,
    pageState,
  })

  return {
    ...pageState,
    ...metaState,
    ...presentationState,
    ...panelState,
    getUserAvatarColor,
  }
}
