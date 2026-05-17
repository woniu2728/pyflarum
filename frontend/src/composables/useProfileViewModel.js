import { computed, watch } from 'vue'
import { getPageState, getUserBadges } from '@/forum/registry'
import { useProfilePage } from '@/composables/useProfilePage'
import { useProfilePanelState } from '@/composables/useProfilePanelState'
import { useProfilePresentation } from '@/composables/useProfilePresentation'
import { getUserAvatarColor } from '@/utils/forum'
import { resolveProfileMetaPayload } from '@/utils/profileMeta'

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
  const panelState = useProfilePanelState({
    authStore,
    formatDate: presentationState.formatDate,
    pageState,
  })

  const userBadges = computed(() => {
    if (!pageState.user.value) return []

    return getUserBadges({
      user: pageState.user.value,
      authStore,
    })
  })

  const loadingStateText = computed(() => {
    const pageStateBlock = getPageState({
      surface: 'profile-loading',
      loading: pageState.loading.value,
      user: pageState.user.value,
    })

    return pageStateBlock?.text || '加载中...'
  })

  const missingStateText = computed(() => {
    const pageStateBlock = getPageState({
      surface: 'profile-not-found',
      loading: pageState.loading.value,
      user: pageState.user.value,
    })

    return pageStateBlock?.text || '用户不存在'
  })

  watch(
    pageState.user,
    value => {
      const payload = resolveProfileMetaPayload(value)
      if (!payload) return
      forumStore.setPageMeta(payload)
    },
    { immediate: true }
  )

  return {
    ...pageState,
    ...presentationState,
    ...panelState,
    getUserAvatarColor,
    loadingStateText,
    missingStateText,
    userBadges,
  }
}
