import { computed, ref } from 'vue'
import api from '@/api'
import { getUiCopy } from '@/forum/registry'
import { useProfileAccountActions } from '@/composables/useProfileAccountActions'
import { useProfileContentState } from '@/composables/useProfileContentState'
import { useProfilePageLifecycle } from '@/composables/useProfilePageLifecycle'
import { useProfileRealtimeState } from '@/composables/useProfileRealtimeState'
import { useProfileUserState } from '@/composables/useProfileUserState'
import { useForumRealtimeStore } from '@/stores/forumRealtime'
import { useResourceStore } from '@/stores/resource'
import { normalizeUser } from '@/utils/forum'
import { useProfileRouteState } from './useProfileRouteState'

export function useProfilePage({
  authStore,
  modalStore,
  route,
  router
}) {
  const resourceStore = useResourceStore()
  const forumRealtimeStore = useForumRealtimeStore()
  const routeState = useProfileRouteState({ route, router })
  const saving = ref(false)
  const avatarUploading = ref(false)
  const avatarInput = ref(null)
  const settingsSuccess = ref('')
  const settingsError = ref('')
  const verificationSending = ref(false)
  const verificationSuccess = ref('')
  const verificationError = ref('')
  const changingPassword = ref(false)
  const passwordSuccess = ref('')
  const passwordError = ref('')
  const loadingPreferences = ref(false)
  const savingPreferences = ref(false)
  const preferencesSuccess = ref('')
  const preferencesError = ref('')

  const editForm = ref({
    display_name: '',
    bio: '',
    email: ''
  })

  const passwordForm = ref({
    old_password: '',
    new_password: '',
    confirm_password: ''
  })

  const preferences = ref({
    values: {},
    definitions: []
  })

  const activeTab = routeState.activeTab
  function getProfileUiCopy(surface, context = {}, fallback = '') {
    return getUiCopy({
      surface,
      ...context,
    })?.text || fallback
  }

  function getProfileErrorMessage(error, fallback = getProfileUiCopy('profile-error-unknown', {}, '未知错误')) {
    return error.response?.data?.error || error.response?.data?.detail || error.message || fallback
  }
  const profileUserState = useProfileUserState({
    activeTab,
    authStore,
    getLoadUserErrorText() {
      return getProfileUiCopy('profile-settings-load-error', {}, '加载用户失败，请稍后重试')
    },
    getProfileErrorMessage,
    loadPreferences() {
      return profileAccountActions.loadPreferences()
    },
    markPostsRequestedForCurrentUser() {
      profileContentState.markPostsRequestedForCurrentUser()
    },
    normalizeUser,
    resourceStore,
    route,
    setEditForm(payload) {
      editForm.value = payload
    },
    setSettingsError(message) {
      settingsError.value = message
    },
    setVerificationError(message) {
      verificationError.value = message
    },
    setVerificationSuccess(message) {
      verificationSuccess.value = message
    },
  })
  const profileContentState = useProfileContentState({
    activeTab,
    forumRealtimeStore,
    getErrorMessage: getProfileErrorMessage,
    getLoadDiscussionsErrorText() {
      return getProfileUiCopy('profile-discussions-load-error', {}, '加载讨论失败，请稍后重试')
    },
    getLoadPostsErrorText() {
      return getProfileUiCopy('profile-posts-load-error', {}, '加载回复失败，请稍后重试')
    },
    getUser() {
      return profileUserState.user.value
    },
    resourceStore,
    setSettingsError(message) {
      settingsError.value = message
    },
    userId: profileUserState.userId,
  })
  const profileRealtimeState = useProfileRealtimeState({
    activeTab,
    contentState: profileContentState,
    resourceStore,
    userId: profileUserState.userId,
  })

  function addForumEventListener() {
    if (typeof window === 'undefined') return
    window.addEventListener('bias:forum-event', profileRealtimeState.handleForumEvent)
  }

  function removeForumEventListener() {
    if (typeof window === 'undefined') return
    window.removeEventListener('bias:forum-event', profileRealtimeState.handleForumEvent)
  }

  function cleanupTrackedDiscussions() {
    profileContentState.cleanupTrackedDiscussions()
  }

  function resetProfileScope() {
    profileUserState.resetUserScope()
    profileContentState.resetProfileScope()
  }

  useProfilePageLifecycle({
    addForumEventListener,
    cleanupTrackedDiscussions,
    refreshProfile: profileUserState.refreshProfile,
    removeForumEventListener,
    resetProfileScope,
    route,
  })

  async function loadDiscussions() {
    await profileContentState.loadDiscussions()
  }

  async function loadPosts(options = {}) {
    await profileContentState.loadPosts(options)
  }

  function switchTab(tab) {
    const nextTab = String(tab || '').trim() || 'discussions'
    if (nextTab === activeTab.value) return
    if (nextTab === 'posts' && profileUserState.userId.value) {
      profileContentState.markPostsRequestedForCurrentUser()
    }
    void routeState.push({
      activeTab: nextTab,
    })
  }

  const profileAccountActions = useProfileAccountActions({
    apiClient: api,
    authStore,
    avatarInput,
    avatarUploading,
    changingPassword,
    editForm,
    getProfileErrorMessage,
    getProfileUiCopy,
    loadingPreferences,
    modalStore,
    passwordError,
    passwordForm,
    passwordSuccess,
    preferences,
    preferencesError,
    preferencesSuccess,
    resourceStore,
    saving,
    savingPreferences,
    settingsError,
    settingsSuccess,
    user: profileUserState.user,
    userId: profileUserState.userId,
    verificationError,
    verificationSending,
    verificationSuccess,
    normalizeUser,
  })

  return {
    user: profileUserState.user,
    discussions: profileContentState.discussions,
    posts: profileContentState.posts,
    loading: profileUserState.loading,
    loadingDiscussions: profileContentState.loadingDiscussions,
    loadingPosts: profileContentState.loadingPosts,
    activeTab,
    saving,
    avatarUploading,
    avatarInput,
    settingsSuccess,
    settingsError,
    verificationSending,
    verificationSuccess,
    verificationError,
    changingPassword,
    passwordSuccess,
    passwordError,
    loadingPreferences,
    savingPreferences,
    preferencesSuccess,
    preferencesError,
    editForm,
    passwordForm,
    preferences,
    isOwnProfile: profileUserState.isOwnProfile,
    switchTab,
    saveProfile: profileAccountActions.saveProfile,
    savePreferences: profileAccountActions.savePreferences,
    resendVerificationEmail: profileAccountActions.resendVerificationEmail,
    changePassword: profileAccountActions.changePassword,
    handleAvatarSelected: profileAccountActions.handleAvatarSelected
  }
}
