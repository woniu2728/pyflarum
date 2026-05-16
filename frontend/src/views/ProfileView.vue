<template>
  <div class="profile-page">
    <ForumStateBlock v-if="loading" class="profile-state-block">{{ loadingStateText }}</ForumStateBlock>
    <ForumStateBlock v-else-if="!user" class="profile-state-block">{{ missingStateText }}</ForumStateBlock>
    <div v-else>
      <ProfileHero
        :user="user"
        :user-badges="userBadges"
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
              @update-edit-form="handleEditFormUpdate"
              @update-password-form="handlePasswordFormUpdate"
              @update-preference="handlePreferenceUpdate"
            />
          </main>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useForumStore } from '@/stores/forum'
import { useModalStore } from '@/stores/modal'
import ForumStateBlock from '@/components/forum/ForumStateBlock.vue'
import ProfileHero from '@/components/profile/ProfileHero.vue'
import ProfileSidebar from '@/components/profile/ProfileSidebar.vue'
import { useProfileViewModel } from '@/composables/useProfileViewModel'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const forumStore = useForumStore()
const modalStore = useModalStore()
const {
  activeTab,
  activePanel,
  avatarUploading,
  avatarInput,
  formatJoinDate,
  formatLastSeen,
  getUserAvatarColor,
  getUserPrimaryGroupColor,
  getUserPrimaryGroupIcon,
  getUserPrimaryGroupLabel,
  handleAvatarSelected,
  handleEditFormUpdate,
  handlePasswordFormUpdate,
  handlePreferenceUpdate,
  isOnline,
  isOwnProfile,
  loading,
  loadingStateText,
  missingStateText,
  profilePanels,
  switchTab,
  user,
  userBadges,
} = useProfileViewModel({
  authStore,
  forumStore,
  modalStore,
  route,
  router,
})
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
