<template>
  <div class="index-page">
    <div class="index-container">
      <DiscussionListSidebar
        :auth-store="authStore"
        :current-tag="currentTag"
        :is-own-profile-page="isOwnProfilePage"
        :sidebar-filter-items="sidebarFilterItems"
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

      <DiscussionListContent
        :auth-store="authStore"
        :current-tag="currentTag"
        :is-following-page="isFollowingPage"
        :sort-by="sortBy"
        :sort-options="sortOptions"
        :list-filter="listFilter"
        :filter-options="filterOptions"
        :search-query="searchQuery"
        :marking-all-read="markingAllRead"
        :loading="loading"
        :refreshing="refreshing"
        :discussions="discussions"
        :empty-state-text="emptyStateText"
        :loading-state-text="loadingStateText"
        :has-more="hasMore"
        :loading-more="loadingMore"
        :build-discussion-path="buildDiscussionPath"
        :build-tag-path="buildTagPath"
        :build-user-path="buildUserPath"
        :format-relative-time="formatRelativeTime"
        :get-user-avatar-color="getUserAvatarColor"
        :get-user-display-name="getUserDisplayName"
        :get-user-initial="getUserInitial"
        @change-sort="changeSortBy"
        @change-filter="changeListFilter"
        @change-search="changeSearchQuery"
        @mark-all-read="markAllAsRead"
        @refresh="refreshDiscussionList"
        @load-more="loadMore"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'
import DiscussionListContent from '@/components/discussion/DiscussionListContent.vue'
import DiscussionListSidebar from '@/components/discussion/DiscussionListSidebar.vue'
import { getUiCopy } from '@/forum/registry'
import { useDiscussionListPage } from '@/composables/useDiscussionListPage'
import { useAuthStore } from '@/stores/auth'
import { useComposerStore } from '@/stores/composer'
import { useForumStore } from '@/stores/forum'
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
const forumStore = useForumStore()
const modalStore = useModalStore()
const route = useRoute()
const router = useRouter()
const {
  discussions,
  currentTag,
  loading,
  refreshing,
  loadingMore,
  sortBy,
  sortOptions,
  listFilter,
  filterOptions,
  searchQuery,
  markingAllRead,
  hasMore,
  isFollowingPage,
  isTagsPage,
  isOwnProfilePage,
  sidebarFilterItems,
  sidebarPrimaryTagItems,
  sidebarSecondaryTagItems,
  hasSidebarTagNavigation,
  showMoreTagsLink,
  startDiscussionButtonStyle,
  emptyStateText,
  loadingStateText,
  refreshDiscussionList,
  changeSortBy,
  changeListFilter,
  changeSearchQuery,
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

const activeFilterCode = computed(() => isFollowingPage.value ? 'following' : String(listFilter.value || 'all'))
const pageMetaTitle = computed(() => getUiCopy({
  surface: 'discussion-list-page-meta-title',
  listFilter: activeFilterCode.value,
  currentTagName: currentTag.value?.name || '',
  searchQuery: searchQuery.value,
  hasSearchQuery: Boolean(searchQuery.value),
})?.text || resolveDiscussionListPageMetaTitle())

const pageMetaDescription = computed(() => getUiCopy({
  surface: 'discussion-list-page-meta-description',
  listFilter: activeFilterCode.value,
  currentTagName: currentTag.value?.name || '',
  currentTagDescription: currentTag.value?.description || '',
  searchQuery: searchQuery.value,
  hasSearchQuery: Boolean(searchQuery.value),
})?.text || resolveDiscussionListPageMetaDescription())

watch(
  () => [pageMetaTitle.value, pageMetaDescription.value, route.fullPath],
  () => {
    forumStore.setPageMeta({
      title: pageMetaTitle.value,
      description: pageMetaDescription.value,
      canonicalUrl: route.fullPath,
    })
  },
  { immediate: true }
)

function resolveDiscussionListPageMetaTitle() {
  const search = String(searchQuery.value || '').trim()
  const currentTagName = currentTag.value?.name || ''
  const baseTitle = currentTagName || resolveDiscussionListFilterHeroTitle(activeFilterCode.value)

  return search ? `${baseTitle} - 搜索“${search}”` : baseTitle
}

function resolveDiscussionListPageMetaDescription() {
  const search = String(searchQuery.value || '').trim()
  const currentTagName = currentTag.value?.name || ''
  const currentTagDescription = String(currentTag.value?.description || '').trim()

  if (currentTagName) {
    if (search) {
      return `查看标签“${currentTagName}”下与“${search}”相关的讨论。`
    }

    return currentTagDescription || `查看标签“${currentTagName}”下的最新讨论和回复。`
  }

  if (search) {
    return `在${resolveDiscussionListFilterLabel(activeFilterCode.value)}中搜索与“${search}”相关的讨论。`
  }

  switch (activeFilterCode.value) {
    case 'following':
      return '查看你关注的讨论和最新回复。'
    case 'unread':
      return '集中查看你还有未读回复的讨论。'
    case 'my':
      return '集中查看你发起过的讨论与最新互动。'
    default:
      return '浏览论坛最新讨论、热门主题和社区回复。'
  }
}

function resolveDiscussionListFilterLabel(filterCode) {
  switch (String(filterCode || 'all').trim()) {
    case 'following':
      return '关注中'
    case 'unread':
      return '未读'
    case 'my':
      return '我的讨论'
    default:
      return '全部讨论'
  }
}

function resolveDiscussionListFilterHeroTitle(filterCode) {
  switch (String(filterCode || 'all').trim()) {
    case 'following':
      return '关注的讨论'
    case 'unread':
      return '未读讨论'
    case 'my':
      return '我的讨论'
    default:
      return '全部讨论'
  }
}

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
