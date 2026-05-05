<template>
  <div class="profile-page">
    <ForumStateBlock v-if="loading" class="profile-state-block">加载中...</ForumStateBlock>
    <ForumStateBlock v-else-if="!user" class="profile-state-block">用户不存在</ForumStateBlock>
    <div v-else>
      <ProfileHero
        :user="user"
        :is-own-profile="isOwnProfile"
        :is-online="isOnline"
        :avatar-uploading="avatarUploading"
        :avatar-input-ref="avatarInput"
        :format-join-date="formatJoinDate"
        :format-last-seen="formatLastSeen"
        :get-user-avatar-color="getUserAvatarColor"
        :get-user-primary-group-icon="getUserPrimaryGroupIcon"
        :get-user-primary-group-color="getUserPrimaryGroupColor"
        :get-user-primary-group-label="getUserPrimaryGroupLabel"
        @avatar-selected="handleAvatarSelected"
        @open-settings="switchTab('settings')"
      />

      <div class="container">
        <div class="user-page-layout">
          <ProfileSidebar
            :active-tab="activeTab"
            :items="profilePanels"
            @change-tab="switchTab"
          />

          <main class="user-content">
            <component
              :is="activePanel?.component"
              v-if="activePanel?.component"
              v-bind="activePanel.componentProps || {}"
              v-on="activePanel.componentEvents || {}"
            />
          </main>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useForumStore } from '@/stores/forum'
import { useModalStore } from '@/stores/modal'
import ForumStateBlock from '@/components/forum/ForumStateBlock.vue'
import ProfileHero from '@/components/profile/ProfileHero.vue'
import ProfileSidebar from '@/components/profile/ProfileSidebar.vue'
import { getProfilePanels } from '@/forum/registry'
import { useProfilePage } from '@/composables/useProfilePage'
import { useProfilePresentation } from '@/composables/useProfilePresentation'
import {
  buildDiscussionPath,
  getUserAvatarColor,
} from '@/utils/forum'

const route = useRoute()
const authStore = useAuthStore()
const forumStore = useForumStore()
const modalStore = useModalStore()
const {
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
} = useProfilePage({
  authStore,
  modalStore,
  route
})
const {
  isOnline,
  getUserPrimaryGroupIcon,
  getUserPrimaryGroupColor,
  getUserPrimaryGroupLabel,
  formatDate,
  formatJoinDate,
  formatLastSeen
} = useProfilePresentation(user)

const profilePanels = computed(() => {
  if (!user.value) return []

  return getProfilePanels({
    authStore,
    user: user.value,
    discussions: discussions.value,
    posts: posts.value,
    loadingDiscussions: loadingDiscussions.value,
    loadingPosts: loadingPosts.value,
    isOwnProfile: isOwnProfile.value,
    buildDiscussionPath,
    formatDate,
    editForm: editForm.value,
    preferences: preferences.value,
    saving: saving.value,
    settingsSuccess: settingsSuccess.value,
    settingsError: settingsError.value,
    loadingPreferences: loadingPreferences.value,
    savingPreferences: savingPreferences.value,
    preferencesSuccess: preferencesSuccess.value,
    preferencesError: preferencesError.value,
    saveProfile,
    savePreferences,
    passwordForm: passwordForm.value,
    verificationSending: verificationSending.value,
    verificationSuccess: verificationSuccess.value,
    verificationError: verificationError.value,
    resendVerificationEmail,
    changingPassword: changingPassword.value,
    passwordSuccess: passwordSuccess.value,
    passwordError: passwordError.value,
    changePassword,
  })
})

const activePanel = computed(() => {
  return profilePanels.value.find(item => item.key === activeTab.value) || profilePanels.value[0] || null
})

watch(
  profilePanels,
  value => {
    if (!value.length) return
    if (!value.some(item => item.key === activeTab.value)) {
      switchTab(value[0].key)
    }
  },
  { immediate: true }
)

watch(
  user,
  value => {
    if (!value) return
    const displayName = value.display_name || value.username
    const bio = String(value.bio || '').replace(/\s+/g, ' ').trim()
    forumStore.setPageMeta({
      title: `${displayName} 的主页`,
      description: bio || `${displayName} 在论坛发布了 ${value.discussion_count || 0} 个讨论和 ${value.comment_count || 0} 条回复。`,
      canonicalUrl: `/u/${value.username || value.id}`,
    })
  },
  { immediate: true }
)

</script>

<style scoped>
.profile-page {
  background: #f5f8fa;
  min-height: calc(100vh - 56px);
}

.profile-state-block {
  max-width: 1200px;
  margin: 0 auto;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.user-page-layout {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 25px;
  padding: 40px 0 30px 0;
  min-width: 0;
}

.user-content {
  min-width: 0;
  background: white;
  border: 1px solid #e3e8ed;
  border-radius: 3px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

@media (max-width: 768px) {
  .container {
    padding: 0 14px;
  }

  .user-page-layout {
    grid-template-columns: 1fr;
    gap: 14px;
    padding: 28px 0 22px;
  }
}
</style>
