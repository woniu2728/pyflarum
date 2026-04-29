<template>
  <div class="index-page">
    <div class="index-container">
      <DiscussionListSidebar
        :auth-store="authStore"
        :current-tag="currentTag"
        :is-all-discussions-page="isAllDiscussionsPage"
        :is-following-page="isFollowingPage"
        :is-own-profile-page="isOwnProfilePage"
        :is-tags-page="isTagsPage"
        :has-sidebar-tag-navigation="hasSidebarTagNavigation"
        :sidebar-primary-tag-items="sidebarPrimaryTagItems"
        :sidebar-secondary-tag-items="sidebarSecondaryTagItems"
        :show-more-tags-link="showMoreTagsLink"
        :start-discussion-button-style="startDiscussionButtonStyle"
        :build-user-path="buildUserPath"
        :build-tag-path="buildTagPath"
        :is-sidebar-tag-active="isSidebarTagActive"
        :get-sidebar-tag-style="getSidebarTagStyle"
        @start-discussion="handleStartDiscussion"
      />

      <main class="index-content">
        <DiscussionListHeaderSection
          :auth-store="authStore"
          :current-tag="currentTag"
          :is-following-page="isFollowingPage"
          :sort-by="sortBy"
          :marking-all-read="markingAllRead"
          @change-sort="changeSortBy"
          @mark-all-read="markAllAsRead"
          @refresh="refreshPageData"
        />

        <div v-if="loading" class="loading-container">
          <div class="spinner"></div>
        </div>

        <div v-else-if="discussions.length === 0" class="empty-state">
          <p>{{ emptyStateText }}</p>
        </div>

        <ul v-else class="discussion-list">
          <DiscussionListItem
            v-for="discussion in discussions"
            :key="discussion.id"
            :discussion="discussion"
            :build-discussion-path="buildDiscussionPath"
            :build-tag-path="buildTagPath"
            :build-user-path="buildUserPath"
            :format-relative-time="formatRelativeTime"
            :get-user-avatar-color="getUserAvatarColor"
            :get-user-display-name="getUserDisplayName"
            :get-user-initial="getUserInitial"
          />
        </ul>

        <div v-if="hasMore" class="load-more">
          <button class="btn btn-default" @click="loadMore" :disabled="loadingMore">
            {{ loadingMore ? '加载中...' : '加载更多' }}
          </button>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import DiscussionListHeaderSection from '@/components/discussion/DiscussionListHeaderSection.vue'
import DiscussionListItem from '@/components/discussion/DiscussionListItem.vue'
import DiscussionListSidebar from '@/components/discussion/DiscussionListSidebar.vue'
import { useDiscussionListPage } from '@/composables/useDiscussionListPage'
import { useAuthStore } from '@/stores/auth'
import { useComposerStore } from '@/stores/composer'
import { useModalStore } from '@/stores/modal'
import { useRoute, useRouter } from 'vue-router'
import {
  buildDiscussionPath,
  buildTagPath,
  buildUserPath,
  formatRelativeTime,
  getUserAvatarColor,
  getUserDisplayName,
  getUserInitial
} from '@/utils/forum'

const authStore = useAuthStore()
const composerStore = useComposerStore()
const modalStore = useModalStore()
const route = useRoute()
const router = useRouter()
const {
  discussions,
  currentTag,
  loading,
  loadingMore,
  sortBy,
  markingAllRead,
  hasMore,
  isFollowingPage,
  isTagsPage,
  isAllDiscussionsPage,
  isOwnProfilePage,
  sidebarPrimaryTagItems,
  sidebarSecondaryTagItems,
  hasSidebarTagNavigation,
  showMoreTagsLink,
  startDiscussionButtonStyle,
  emptyStateText,
  refreshPageData,
  changeSortBy,
  loadMore,
  markAllAsRead,
  handleStartDiscussion,
  getSidebarTagStyle,
  isSidebarTagActive
} = useDiscussionListPage({
  authStore,
  composerStore,
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

/* ========== 主内容区 ========== */
.index-content {
  flex: 1;
  background: var(--forum-bg-elevated);
}

/* ========== 讨论列表 ========== */
.discussion-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

/* 加载状态 */
.loading-container {
  display: flex;
  justify-content: center;
  padding: 60px 20px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--forum-border-color);
  border-top-color: var(--forum-primary-color);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
  color: var(--forum-text-soft);
  font-size: 15px;
}

.load-more {
  text-align: center;
  padding: 20px;
  border-top: 1px solid var(--forum-border-color);
}

.btn {
  padding: 8px 16px;
  border-radius: 3px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-default {
  background: var(--forum-bg-subtle);
  color: var(--forum-text-muted);
}

.btn-default:hover {
  background: #dbe5ed;
}

.btn-default:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
