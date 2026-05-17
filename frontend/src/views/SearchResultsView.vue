<template>
  <div class="search-page">
    <ForumPageWithSidebar>
      <template #sidebar>
        <div class="search-sidebar-stack">
          <DiscussionListSidebarStartButton
            v-if="sidebarBindings.showStartDiscussionButton"
            :current-tag="null"
            :start-discussion-button-style="{}"
            @click="sidebarEvents.startDiscussion"
          />

          <ForumSearchFilterNav
            :items="sidebarBindings.filterItems"
            :active-value="sidebarBindings.searchType"
            @change="sidebarEvents.changeType"
          />
        </div>
      </template>

      <main class="search-content">
        <ForumHeroPanel
          :pill="heroBindings.pill"
          :title="heroBindings.title"
          :description="heroBindings.description"
          :variant="heroBindings.variant"
        >
          <template #meta>
            <ForumSearchStats
              v-if="heroBindings.normalizedQuery"
              :items="heroBindings.searchStatsItems"
            />
            <div v-if="heroBindings.syntaxItems.length" class="search-syntax-row">
              <button
                v-for="item in heroBindings.syntaxItems"
                :key="item.key"
                type="button"
                class="search-syntax-chip"
                @click="heroEvents.applySyntax(item.syntax)"
              >
                <strong>{{ item.syntax }}</strong>
                <span>{{ item.label }}</span>
              </button>
            </div>
          </template>
        </ForumHeroPanel>

        <ForumInlineMessage v-if="contentBindings.filterCatalogLoadError" tone="danger">
          {{ contentBindings.filterCatalogLoadError }}
        </ForumInlineMessage>

        <ForumStateBlock v-if="!contentBindings.normalizedQuery">
          {{ contentBindings.idleStateText }}
        </ForumStateBlock>
        <ForumStateBlock v-else-if="contentBindings.loading">
          {{ contentBindings.loadingStateText }}
        </ForumStateBlock>
        <ForumStateBlock v-else-if="contentBindings.isEmpty">
          {{ contentBindings.emptyStateText }}
        </ForumStateBlock>
        <template v-else>
          <ForumSearchResultSection
            v-for="section in contentBindings.visibleSearchSections"
            :key="section.key"
            :title="section.label"
            :show-more="section.showMore"
            @show-more="contentEvents.changeType(section.key)"
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
              @click="contentEvents.openSearchResult(item.path)"
            />
          </ForumSearchResultSection>

          <ForumPagination
            v-if="contentBindings.searchType !== 'all' && contentBindings.totalPages > 1"
            :current-page="contentBindings.page"
            :total-pages="contentBindings.totalPages"
            @change="contentEvents.changePage"
          />
        </template>
      </main>
    </ForumPageWithSidebar>
  </div>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useComposerStore } from '@/stores/composer'
import { useForumStore } from '@/stores/forum'
import ForumHeroPanel from '@/components/forum/ForumHeroPanel.vue'
import ForumInlineMessage from '@/components/forum/ForumInlineMessage.vue'
import ForumPagination from '@/components/forum/ForumPagination.vue'
import ForumPageWithSidebar from '@/components/forum/ForumPageWithSidebar.vue'
import ForumSearchFilterNav from '@/components/forum/ForumSearchFilterNav.vue'
import ForumSearchResultCard from '@/components/forum/ForumSearchResultCard.vue'
import ForumSearchResultSection from '@/components/forum/ForumSearchResultSection.vue'
import ForumSearchStats from '@/components/forum/ForumSearchStats.vue'
import ForumStateBlock from '@/components/forum/ForumStateBlock.vue'
import DiscussionListSidebarStartButton from '@/components/discussion/DiscussionListSidebarStartButton.vue'
import { useSearchResultsViewModel } from '@/composables/useSearchResultsViewModel'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const composerStore = useComposerStore()
const forumStore = useForumStore()
const {
  contentBindings,
  contentEvents,
  heroBindings,
  heroEvents,
  sidebarBindings,
  sidebarEvents,
} = useSearchResultsViewModel({
  authStore,
  composerStore,
  forumStore,
  route,
  router
})
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
