import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import api from '@/api'
import { getUiCopy } from '@/forum/registry'
import { useForumRealtimeStore } from '@/stores/forumRealtime'
import { useResourceStore } from '@/stores/resource'
import {
  normalizeDiscussion,
  normalizePost,
  normalizeUser,
  unwrapList
} from '@/utils/forum'
import {
  mergeForumEventPayload,
  shouldRefreshForumEvent,
} from '@/utils/forumRealtime'

export function useProfilePage({
  authStore,
  modalStore,
  route
}) {
  const resourceStore = useResourceStore()
  const forumRealtimeStore = useForumRealtimeStore()
  const userId = ref(null)
  const discussionIds = ref([])
  const postIds = ref([])
  const user = computed(() => (userId.value ? resourceStore.get('users', userId.value) : null))
  const discussions = computed(() => resourceStore.list('discussions', discussionIds.value))
  const posts = computed(() => resourceStore.list('posts', postIds.value))
  const loading = ref(true)
  const loadingDiscussions = ref(false)
  const loadingPosts = ref(false)
  const activeTab = ref('discussions')
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

  onMounted(async () => {
    await refreshProfile()
    window.addEventListener('bias:forum-event', handleForumEvent)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('bias:forum-event', handleForumEvent)
    forumRealtimeStore.untrackDiscussionIds(discussionIds.value)
  })

  watch(() => route.params.id, async () => {
    forumRealtimeStore.untrackDiscussionIds(discussionIds.value)
    postIds.value = []
    discussionIds.value = []
    userId.value = null
    await refreshProfile()
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
      await loadPreferences()
    }
    await loadDiscussions()
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
    if (!user.value) return

    loadingDiscussions.value = true
    try {
      const data = await api.get('/discussions/', {
        params: {
          author: user.value.username,
          sort: 'newest',
          limit: 20
        }
      })
      discussionIds.value = unwrapList(data)
        .map(normalizeDiscussion)
        .map(item => resourceStore.upsert('discussions', item).id)
      forumRealtimeStore.trackDiscussionIds(discussionIds.value)
    } catch (error) {
      console.error('加载讨论失败:', error)
      settingsError.value = getProfileErrorMessage(
        error,
        getProfileUiCopy('profile-discussions-load-error', {}, '加载讨论失败，请稍后重试')
      )
    } finally {
      loadingDiscussions.value = false
    }
  }

  async function loadPosts() {
    if (!user.value || posts.value.length > 0) return

    loadingPosts.value = true
    try {
      const data = await api.get('/posts', {
        params: {
          author: user.value.username,
          limit: 20
        }
      })
      postIds.value = unwrapList(data)
        .map(normalizePost)
        .map(item => resourceStore.upsert('posts', item).id)
    } catch (error) {
      console.error('加载回复失败:', error)
      settingsError.value = getProfileErrorMessage(
        error,
        getProfileUiCopy('profile-posts-load-error', {}, '加载回复失败，请稍后重试')
      )
    } finally {
      loadingPosts.value = false
    }
  }

  function mergePostIds(ids = []) {
    const seen = new Set()
    postIds.value = [...postIds.value, ...ids].filter(id => {
      const key = String(id)
      if (seen.has(key)) {
        return false
      }
      seen.add(key)
      return true
    })
  }

  function switchTab(tab) {
    activeTab.value = tab
    if (tab === 'posts' && posts.value.length === 0) {
      loadPosts()
    }
  }

  async function saveProfile() {
    saving.value = true
    settingsSuccess.value = ''
    settingsError.value = ''

    try {
      const previousEmail = user.value.email
      const updatedUser = await api.patch(`/users/${user.value.id}`, editForm.value)

      const nextUser = resourceStore.upsert('users', {
        ...user.value,
        ...normalizeUser(updatedUser)
      })
      userId.value = nextUser.id

      editForm.value = {
        display_name: nextUser.display_name || '',
        bio: nextUser.bio || '',
        email: nextUser.email || ''
      }

      await authStore.fetchUser()

      settingsSuccess.value = getUiCopy({
        surface: 'profile-settings-save-success',
        emailChanged: previousEmail !== nextUser.email,
        email: nextUser.email,
      })?.text || (previousEmail !== nextUser.email
        ? `资料已保存，验证邮件已发送到 ${nextUser.email}`
        : '资料已保存')
    } catch (error) {
      settingsError.value = getProfileErrorMessage(
        error,
        getProfileUiCopy('profile-settings-save-error', {}, '保存失败')
      )
    } finally {
      saving.value = false
    }
  }

  async function loadPreferences() {
    loadingPreferences.value = true
    preferencesError.value = ''

    try {
      const data = await api.get('/users/me/preferences')
      preferences.value = {
        values: { ...(data.values || {}) },
        definitions: Array.isArray(data.definitions) ? data.definitions : []
      }
      if (authStore.user) {
        authStore.user.preferences = { ...data }
      }
    } catch (error) {
      preferencesError.value = getProfileErrorMessage(
        error,
        getProfileUiCopy('profile-preferences-load-error', {}, '加载通知偏好失败')
      )
    } finally {
      loadingPreferences.value = false
    }
  }

  async function savePreferences() {
    savingPreferences.value = true
    preferencesSuccess.value = ''
    preferencesError.value = ''

    try {
      const data = await api.patch('/users/me/preferences', {
        values: { ...(preferences.value.values || {}) }
      })

      preferences.value = {
        values: { ...(data.values || {}) },
        definitions: Array.isArray(data.definitions) ? data.definitions : []
      }
      if (authStore.user) {
        authStore.user.preferences = { ...data }
      }
      preferencesSuccess.value = getUiCopy({
        surface: 'profile-preferences-save-success',
      })?.text || '通知偏好已保存'
    } catch (error) {
      preferencesError.value = getProfileErrorMessage(
        error,
        getProfileUiCopy('profile-preferences-save-error', {}, '保存通知偏好失败')
      )
    } finally {
      savingPreferences.value = false
    }
  }

  async function resendVerificationEmail() {
    verificationSending.value = true
    verificationSuccess.value = ''
    verificationError.value = ''

    try {
      const data = await api.post('/users/me/resend-email-verification')
      verificationSuccess.value = data.message || getUiCopy({
        surface: 'profile-verification-success',
      })?.text || '验证邮件已发送'
    } catch (error) {
      verificationError.value = getProfileErrorMessage(
        error,
        getProfileUiCopy('profile-verification-error', {}, '发送失败')
      )
    } finally {
      verificationSending.value = false
    }
  }

  async function changePassword() {
    passwordSuccess.value = ''
    passwordError.value = ''

    if (!passwordForm.value.old_password || !passwordForm.value.new_password) {
      passwordError.value = getUiCopy({
        surface: 'profile-password-empty-error',
      })?.text || '请完整填写密码信息'
      return
    }

    if (passwordForm.value.new_password !== passwordForm.value.confirm_password) {
      passwordError.value = getUiCopy({
        surface: 'profile-password-mismatch-error',
      })?.text || '两次输入的新密码不一致'
      return
    }

    changingPassword.value = true
    try {
      const data = await api.post(`/users/${user.value.id}/password`, {
        old_password: passwordForm.value.old_password,
        new_password: passwordForm.value.new_password
      })
      passwordSuccess.value = data.message || getUiCopy({
        surface: 'profile-password-success',
      })?.text || '密码修改成功'
      passwordForm.value = {
        old_password: '',
        new_password: '',
        confirm_password: ''
      }
    } catch (error) {
      passwordError.value = getProfileErrorMessage(
        error,
        getProfileUiCopy('profile-password-error', {}, '密码修改失败')
      )
    } finally {
      changingPassword.value = false
    }
  }

  async function handleAvatarSelected(event) {
    const file = event.target.files?.[0]
    if (!file || !user.value) return

    avatarUploading.value = true
    try {
      const formData = new FormData()
      formData.append('avatar', file)

      const updatedUser = await api.post(`/users/${user.value.id}/avatar`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      const nextUser = resourceStore.upsert('users', normalizeUser(updatedUser))
      userId.value = nextUser.id
      editForm.value = {
        display_name: nextUser.display_name || '',
        bio: nextUser.bio || '',
        email: nextUser.email || ''
      }
      await authStore.fetchUser()
    } catch (error) {
      await modalStore.alert({
        title: getProfileUiCopy('profile-avatar-upload-error-title', {}, '头像上传失败'),
        message: getProfileErrorMessage(
          error,
          getProfileUiCopy('profile-avatar-upload-error-message', {}, '未知错误')
        ),
        tone: 'danger'
      })
    } finally {
      avatarUploading.value = false
      if (avatarInput.value) {
        avatarInput.value.value = ''
      }
    }
  }

  async function handleForumEvent(event) {
    const detail = event.detail || {}
    const discussionId = Number(detail.discussion_id)
    const visibleDiscussionIds = new Set(discussionIds.value.map(id => String(id)))

    if (discussionId && visibleDiscussionIds.has(String(discussionId))) {
      if (shouldRefreshForumEvent(detail.event_type)) {
        await loadDiscussions()
        if (activeTab.value === 'posts' && posts.value.length) {
          await loadPosts()
        }
        return
      }

      mergeForumEventPayload(resourceStore, detail)
      if (detail.payload?.post && posts.value.some(post => Number(post?.discussion_id) === discussionId)) {
        const postId = Number(detail.payload.post.id || 0)
        if (postId > 0) {
          mergePostIds([postId])
        }
      }
    }
  }

  return {
    user,
    discussions,
    posts,
    loading,
    loadingDiscussions,
    loadingPosts,
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
    saveProfile,
    savePreferences,
    resendVerificationEmail,
    changePassword,
    handleAvatarSelected
  }
}
