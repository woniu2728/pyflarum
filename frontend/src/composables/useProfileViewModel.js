import { computed, watch } from 'vue'
import { getPageState, getProfilePanels, getUserBadges } from '@/forum/registry'
import { useProfilePage } from '@/composables/useProfilePage'
import { useProfilePresentation } from '@/composables/useProfilePresentation'
import { buildDiscussionPath, getUserAvatarColor } from '@/utils/forum'
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

  const profilePanels = computed(() => {
    if (!pageState.user.value) return []

    return getProfilePanels({
      authStore,
      user: pageState.user.value,
      discussions: pageState.discussions.value,
      posts: pageState.posts.value,
      loadingDiscussions: pageState.loadingDiscussions.value,
      loadingPosts: pageState.loadingPosts.value,
      isOwnProfile: pageState.isOwnProfile.value,
      buildDiscussionPath,
      formatDate: presentationState.formatDate,
      editForm: pageState.editForm.value,
      preferences: pageState.preferences.value,
      saving: pageState.saving.value,
      settingsSuccess: pageState.settingsSuccess.value,
      settingsError: pageState.settingsError.value,
      loadingPreferences: pageState.loadingPreferences.value,
      savingPreferences: pageState.savingPreferences.value,
      preferencesSuccess: pageState.preferencesSuccess.value,
      preferencesError: pageState.preferencesError.value,
      saveProfile: pageState.saveProfile,
      savePreferences: pageState.savePreferences,
      passwordForm: pageState.passwordForm.value,
      verificationSending: pageState.verificationSending.value,
      verificationSuccess: pageState.verificationSuccess.value,
      verificationError: pageState.verificationError.value,
      resendVerificationEmail: pageState.resendVerificationEmail,
      changingPassword: pageState.changingPassword.value,
      passwordSuccess: pageState.passwordSuccess.value,
      passwordError: pageState.passwordError.value,
      changePassword: pageState.changePassword,
    })
  })

  const activePanel = computed(() => {
    return profilePanels.value.find(item => item.key === pageState.activeTab.value) || profilePanels.value[0] || null
  })

  watch(
    profilePanels,
    value => {
      if (!value.length) return
      if (!value.some(item => item.key === pageState.activeTab.value)) {
        pageState.switchTab(value[0].key)
      }
    },
    { immediate: true }
  )

  watch(
    pageState.user,
    value => {
      const payload = resolveProfileMetaPayload(value)
      if (!payload) return
      forumStore.setPageMeta(payload)
    },
    { immediate: true }
  )

  function handleEditFormUpdate({ key, value }) {
    if (!pageState.editForm.value || !key) return
    pageState.editForm.value = {
      ...pageState.editForm.value,
      [key]: value,
    }
  }

  function handlePasswordFormUpdate({ key, value }) {
    if (!pageState.passwordForm.value || !key) return
    pageState.passwordForm.value = {
      ...pageState.passwordForm.value,
      [key]: value,
    }
  }

  function handlePreferenceUpdate({ key, value }) {
    if (!pageState.preferences.value || !key) return
    pageState.preferences.value = {
      ...pageState.preferences.value,
      values: {
        ...(pageState.preferences.value.values || {}),
        [key]: Boolean(value),
      },
    }
  }

  return {
    ...pageState,
    ...presentationState,
    activePanel,
    getUserAvatarColor,
    handleEditFormUpdate,
    handlePasswordFormUpdate,
    handlePreferenceUpdate,
    loadingStateText,
    missingStateText,
    profilePanels,
    userBadges,
  }
}
