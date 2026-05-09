<template>
  <div class="search-page">
    <ForumPageWithSidebar>
      <template #sidebar>
        <div class="search-sidebar-stack">
          <DiscussionListSidebarStartButton
            v-if="!authStore.isAuthenticated || authStore.canStartDiscussion"
            :current-tag="null"
            :start-discussion-button-style="{}"
            @click="handleStartDiscussion"
          />

          <ForumSearchFilterNav
            :items="filterItems"
            :active-value="searchType"
            @change="changeType"
          />
        </div>
      </template>

      <main class="search-content">
        <ForumHeroPanel
          :pill="heroPillText"
          :title="heroTitleText"
          :description="heroText"
          variant="primary"
        >
          <template #meta>
            <ForumSearchStats
              v-if="normalizedQuery"
              :items="searchStatsItems"
            />
            <div v-if="syntaxItems.length" class="search-syntax-row">
              <button
                v-for="item in syntaxItems"
                :key="item.key"
                type="button"
                class="search-syntax-chip"
                @click="applySyntax(item.syntax)"
              >
                <strong>{{ item.syntax }}</strong>
                <span>{{ item.label }}</span>
              </button>
            </div>
          </template>
        </ForumHeroPanel>

        <ForumStateBlock v-if="!normalizedQuery">
          {{ idleStateText }}
        </ForumStateBlock>
        <ForumStateBlock v-else-if="loading">
          {{ loadingStateText }}
        </ForumStateBlock>
        <ForumStateBlock v-else-if="isEmpty">
          {{ emptyStateText }}
        </ForumStateBlock>
        <template v-else>
          <ForumSearchResultSection
            v-for="section in visibleSearchSections"
            :key="section.key"
            :title="section.label"
            :show-more="section.showMore"
            @show-more="changeType(section.key)"
          >
            <ForumSearchResultCard
              v-for="item in section.resultItems"
              :key="item.key"
              :avatar-alt="item.avatarAlt || ''"
              :avatar-mode="Boolean(item.avatarMode)"
              :avatar-text="item.avatarText || ''"
              :avatar-url="item.avatarUrl || ''"
              :excerpt-html="item.excerptHtml"
              :icon-class="item.iconClass || section.icon"
              :meta-items="item.metaItems || []"
              :title-html="item.titleHtml"
              :user-layout="Boolean(item.userLayout)"
              @click="openSearchResult(item.path)"
            />
          </ForumSearchResultSection>

          <ForumPagination
            v-if="searchType !== 'all' && totalPages > 1"
            :current-page="page"
            :total-pages="totalPages"
            @change="changePage"
          />
        </template>
      </main>
    </ForumPageWithSidebar>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useComposerStore } from '@/stores/composer'
import { useForumStore } from '@/stores/forum'
import ForumHeroPanel from '@/components/forum/ForumHeroPanel.vue'
import ForumPagination from '@/components/forum/ForumPagination.vue'
import ForumPageWithSidebar from '@/components/forum/ForumPageWithSidebar.vue'
import ForumSearchFilterNav from '@/components/forum/ForumSearchFilterNav.vue'
import ForumSearchResultCard from '@/components/forum/ForumSearchResultCard.vue'
import ForumSearchResultSection from '@/components/forum/ForumSearchResultSection.vue'
import ForumSearchStats from '@/components/forum/ForumSearchStats.vue'
import ForumStateBlock from '@/components/forum/ForumStateBlock.vue'
import DiscussionListSidebarStartButton from '@/components/discussion/DiscussionListSidebarStartButton.vue'
import { getUiCopy } from '@/forum/registry'
import { useSearchResultsPage } from '@/composables/useSearchResultsPage'
import { useStartDiscussionAction } from '@/composables/useStartDiscussionAction'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const composerStore = useComposerStore()
const forumStore = useForumStore()
const { startDiscussion } = useStartDiscussionAction({
  authStore,
  composerStore,
  router
})
const {
  changePage,
  changeType,
  discussionTotal,
  emptyStateText,
  filterItems,
  applySyntax,
  heroText,
  idleStateText,
  loadingStateText,
  isEmpty,
  loading,
  normalizedQuery,
  page,
  postTotal,
  searchType,
  searchSourceSections,
  syntaxItems,
  totalPages,
  userTotal,
} = useSearchResultsPage({
  route,
  router
})

const visibleSearchSections = computed(() => searchSourceSections.value.filter(section => section.visible && section.resultItems.length))
const heroPillText = computed(() => getUiCopy({
  surface: 'search-page-hero-pill',
})?.text || '全局搜索')
const heroTitleText = computed(() => getUiCopy({
  surface: 'search-page-hero-title',
  query: normalizedQuery.value,
})?.text || `“${normalizedQuery.value || '未输入关键词'}”`)
const searchStatsItems = computed(() => [
  { key: 'discussions', label: '讨论', count: discussionTotal.value },
  { key: 'posts', label: '帖子', count: postTotal.value },
  { key: 'users', label: '用户', count: userTotal.value },
])

watch(
  () => [normalizedQuery.value, searchType.value, discussionTotal.value, postTotal.value, userTotal.value],
  () => {
    const query = normalizedQuery.value
    const title = query ? `搜索：${query}` : '搜索'
    const description = query
      ? `查看“${query}”相关的讨论、回复和用户结果。`
      : '搜索论坛中的讨论、回复和用户。'
    forumStore.setPageMeta({
      title,
      description,
      canonicalUrl: `/search${query ? `?q=${encodeURIComponent(query)}&type=${encodeURIComponent(searchType.value)}` : ''}`,
    })
  },
  { immediate: true }
)

function handleStartDiscussion() {
  startDiscussion({
    source: 'search'
  })
}

function openSearchResult(path) {
  if (!path) return
  router.push(path)
}

</script>

<style scoped>
.search-page {
  background: var(--forum-bg-canvas);
  min-height: calc(100vh - 56px);
}

.search-content {
  padding: 24px 28px 40px;
}

.search-sidebar-stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.search-syntax-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 12px;
}

.search-syntax-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 34px;
  padding: 0 12px;
  border: 1px solid rgba(255, 255, 255, 0.36);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
}

.search-syntax-chip strong {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
}

.search-syntax-chip:hover {
  background: rgba(255, 255, 255, 0.2);
}

@media (max-width: 768px) {
  .search-content {
    padding: 18px 14px 32px;
  }

  .search-sidebar-stack {
    gap: 12px;
  }
}
</style>
