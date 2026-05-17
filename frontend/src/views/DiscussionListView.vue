<template>
  <div class="index-page">
    <div class="index-container">
      <DiscussionListSidebar
        v-bind="sidebarBindings"
        @start-discussion="sidebarEvents.startDiscussion"
      />

      <DiscussionListContent
        v-bind="contentBindings"
        @change-sort="contentEvents.changeSort"
        @mark-all-read="contentEvents.markAllRead"
        @refresh="contentEvents.refresh"
        @load-more="contentEvents.loadMore"
      />
    </div>
  </div>
</template>

<script setup>
import DiscussionListContent from '@/components/discussion/DiscussionListContent.vue'
import DiscussionListSidebar from '@/components/discussion/DiscussionListSidebar.vue'
import { useDiscussionListViewModel } from '@/composables/useDiscussionListViewModel'
import { useAuthStore } from '@/stores/auth'
import { useComposerStore } from '@/stores/composer'
import { useForumStore } from '@/stores/forum'
import { useModalStore } from '@/stores/modal'
import { useRoute, useRouter } from 'vue-router'

const authStore = useAuthStore()
const composerStore = useComposerStore()
const forumStore = useForumStore()
const modalStore = useModalStore()
const route = useRoute()
const router = useRouter()
const {
  contentBindings,
  contentEvents,
  sidebarBindings,
  sidebarEvents,
} = useDiscussionListViewModel({
  authStore,
  composerStore,
  forumStore,
  modalStore,
  route,
  router
})
</script>

<style scoped>
.index-page {
  background: var(--forum-bg-canvas);
  min-height: calc(100vh - 56px);
}

.index-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  gap: 0;
}

/* 响应式 */
@media (max-width: 768px) {
  .index-page {
    min-height: calc(100vh - 56px);
  }

  .index-container {
    display: block;
  }
}
</style>
