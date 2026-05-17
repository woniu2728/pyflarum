<template>
  <div class="tags-page">
    <ForumPageWithSidebar>
      <template #sidebar>
        <DiscussionListSidebarStartButton
          v-if="showStartDiscussionButton"
          :current-tag="null"
          :start-discussion-button-style="{}"
          @click="handleStartDiscussion"
        />

        <ForumPrimaryNav :auth-store="authStore" :notification-store="null" active-key="tags" />
      </template>

      <main class="tags-content">
        <ForumHeroPanel :title="heroTitleText" :description="heroDescriptionText" variant="default" />

        <ForumStateBlock v-if="loading">{{ loadingStateText }}</ForumStateBlock>
        <ForumStateBlock v-else-if="tags.length === 0">{{ emptyStateText }}</ForumStateBlock>

        <template v-else>
          <div class="tag-grid">
            <ForumTagTile
              v-for="tag in tags"
              :key="tag.id"
              :tag="tag"
            />
          </div>

          <ForumTagCloud v-if="cloudTags.length" :tags="cloudTags" />
        </template>
      </main>
    </ForumPageWithSidebar>
  </div>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth'
import { useComposerStore } from '@/stores/composer'
import { useForumStore } from '@/stores/forum'
import { useRouter } from 'vue-router'
import ForumHeroPanel from '@/components/forum/ForumHeroPanel.vue'
import ForumPageWithSidebar from '@/components/forum/ForumPageWithSidebar.vue'
import ForumPrimaryNav from '@/components/forum/ForumPrimaryNav.vue'
import ForumStateBlock from '@/components/forum/ForumStateBlock.vue'
import ForumTagCloud from '@/components/forum/ForumTagCloud.vue'
import ForumTagTile from '@/components/forum/ForumTagTile.vue'
import DiscussionListSidebarStartButton from '@/components/discussion/DiscussionListSidebarStartButton.vue'
import { useTagsViewModel } from '@/composables/useTagsViewModel'

const authStore = useAuthStore()
const composerStore = useComposerStore()
const forumStore = useForumStore()
const router = useRouter()
const {
  cloudTags,
  emptyStateText,
  handleStartDiscussion,
  heroDescriptionText,
  heroTitleText,
  loading,
  loadingStateText,
  showStartDiscussionButton,
  tags,
} = useTagsViewModel({
  authStore,
  composerStore,
  forumStore,
  router,
})
</script>

<style scoped>
.tags-page {
  background: var(--forum-bg-canvas);
  min-height: calc(100vh - 56px);
}

.tags-content {
  padding: 24px 28px 40px;
}

.tag-grid {
  display: grid;
  gap: 18px;
}
</style>
