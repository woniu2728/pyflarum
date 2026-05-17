<template>
  <div class="tags-page">
    <ForumPageWithSidebar>
      <template #sidebar>
        <DiscussionListSidebarStartButton
          v-if="sidebarBindings.showStartDiscussionButton"
          :current-tag="null"
          :start-discussion-button-style="{}"
          @click="sidebarEvents.startDiscussion"
        />

        <ForumPrimaryNav :auth-store="sidebarBindings.authStore" :notification-store="null" active-key="tags" />
      </template>

      <main class="tags-content">
        <ForumHeroPanel v-bind="heroBindings" />

        <ForumStateBlock v-if="contentBindings.loading">{{ contentBindings.loadingStateText }}</ForumStateBlock>
        <ForumStateBlock v-else-if="contentBindings.tags.length === 0">{{ contentBindings.emptyStateText }}</ForumStateBlock>

        <template v-else>
          <div class="tag-grid">
            <ForumTagTile
              v-for="tag in contentBindings.tags"
              :key="tag.id"
              :tag="tag"
            />
          </div>

          <ForumTagCloud v-if="contentBindings.cloudTags.length" :tags="contentBindings.cloudTags" />
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
  contentBindings,
  heroBindings,
  sidebarBindings,
  sidebarEvents,
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
