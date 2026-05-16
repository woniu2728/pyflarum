import { computed, ref } from 'vue'
import api from '@/api'
import { getUiCopy } from '@/forum/registry'
import { useProfileAccountActions } from '@/composables/useProfileAccountActions'
import { useProfileContentState } from '@/composables/useProfileContentState'
import { useProfilePageLifecycle } from '@/composables/useProfilePageLifecycle'
import { useForumRealtimeStore } from '@/stores/forumRealtime'
import { useResourceStore } from '@/stores/resource'
import {
  normalizeUser,
} from '@/utils/forum'
import {
  mergeForumEventPayload,
  shouldRefreshForumEvent,
} from '@/utils/forumRealtime'
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
  const userId = ref(null)
  const user = computed(() => (userId.value ? resourceStore.get('users', userId.value) : null))
  const loading = ref(true)
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

  const isOwnProfile = computed(() => authStore.user && user.value && authStore.user.id === user.value.id)
  const activeTab = routeState.activeTab
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
      return user.value
    },
    resourceStore,
    setSettingsError(message) {
      settingsError.value = message
    },
    userId,
  })

  function addForumEventListener() {
    if (typeof window === 'undefined') return
    window.addEventListener('bias:forum-event', handleForumEvent)
  }

  function removeForumEventListener() {
    if (typeof window === 'undefined') return
    window.removeEventListener('bias:forum-event', handleForumEvent)
  }

  function cleanupTrackedDiscussions() {
    profileContentState.cleanupTrackedDiscussions()
  }

  function resetProfileScope() {
    userId.value = null
    profileContentState.resetProfileScope()
  }

  useProfilePageLifecycle({
    addForumEventListener,
    cleanupTrackedDiscussions,
    refreshProfile,
    removeForumEventListener,
    resetProfileScope,
    route,
  })

  function getProfileUiCopy(surface, context = {}, fallback = '') {
    return getUiCopy({
      surface,
      ...context,
    })?.text || fallback
  }

  function getProfileErrorMessage(error, fallback = getProfileUiCopy('profile-error-unknown', {}, '未知错误')) {
    return error.response?.data?.error || error.response?.data?.detail || error.message || fallback
  }

  async function refreshProfile() {
    await loadUser()
    if (isOwnProfile.value) {
      await profileAccountActions.loadPreferences()
    }
  }

  async function loadUser() {
    loading.value = true

    try {
      let data
      if (route.params.id) {
        const identifier = String(route.params.id)
        data = /^\d+$/.test(identifier)
          ? await api.get(`/users/${identifier}`)
          : await api.get(`/users/by-username/${encodeURIComponent(identifier)}`)
      } else {
        data = await api.get('/users/me')
      }

      const normalizedUser = resourceStore.upsert('users', normalizeUser(data))
      userId.value = normalizedUser.id
      if (activeTab.value === 'posts') {
        profileContentState.markPostsRequestedForCurrentUser()
      }

      editForm.value = {
        display_name: normalizedUser.display_name || '',
        bio: normalizedUser.bio || '',
        email: normalizedUser.email || ''
      }

      if (!authStore.user || authStore.user.id !== normalizedUser.id) {
        verificationSuccess.value = ''
        verificationError.value = ''
      }
    } catch (error) {
      console.error('加载用户失败:', error)
      settingsError.value = getProfileErrorMessage(
        error,
        getProfileUiCopy('profile-settings-load-error', {}, '加载用户失败，请稍后重试')
      )
    } finally {
      loading.value = false
    }
  }

  async function loadDiscussions() {
    await profileContentState.loadDiscussions()
  }

  async function loadPosts(options = {}) {
    await profileContentState.loadPosts(options)
  }

  function switchTab(tab) {
    const nextTab = String(tab || '').trim() || 'discussions'
    if (nextTab === activeTab.value) return
    if (nextTab === 'posts' && userId.value) {
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
    user,
    userId,
    verificationError,
    verificationSending,
    verificationSuccess,
    normalizeUser,
  })

  async function handleForumEvent(event) {
    const detail = event.detail || {}
    const discussionId = Number(detail.discussion_id)
    const visibleDiscussionIds = new Set(profileContentState.discussionIds.value.map(id => String(id)))

    if (discussionId && visibleDiscussionIds.has(String(discussionId))) {
      if (shouldRefreshForumEvent(detail.event_type)) {
        await loadDiscussions()
        if (activeTab.value === 'posts' && Number(profileContentState.requestedPostUserId.value || 0) === Number(userId.value || 0)) {
          await loadPosts({ force: true, forceLoading: false })
        }
        return
      }

      mergeForumEventPayload(resourceStore, detail)
      if (detail.payload?.post && profileContentState.posts.value.some(post => Number(post?.discussion_id) === discussionId)) {
        const postId = Number(detail.payload.post.id || 0)
        if (postId > 0) {
          profileContentState.mergePostIds([postId])
        }
      }
    }
  }

  return {
    user,
    discussions: profileContentState.discussions,
    posts: profileContentState.posts,
    loading,
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
    isOwnProfile,
    switchTab,
    saveProfile: profileAccountActions.saveProfile,
    savePreferences: profileAccountActions.savePreferences,
    resendVerificationEmail: profileAccountActions.resendVerificationEmail,
    changePassword: profileAccountActions.changePassword,
    handleAvatarSelected: profileAccountActions.handleAvatarSelected
  }
}
