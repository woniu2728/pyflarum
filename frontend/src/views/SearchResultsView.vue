<template>
  <div class="search-page">
    <ForumPageWithSidebar>
      <template #sidebar>
        <ForumStartDiscussionButton
          v-if="!authStore.isAuthenticated || authStore.canStartDiscussion"
          @click="handleStartDiscussion"
        />

        <nav class="search-filters">
          <button
            v-for="item in filterItems"
            :key="item.value"
            type="button"
            class="filter-item"
            :class="{ active: searchType === item.value }"
            @click="changeType(item.value)"
          >
            <span>{{ item.label }}</span>
            <strong>{{ item.count }}</strong>
          </button>
        </nav>
      </template>

      <main class="search-content">
        <ForumHeroPanel
          pill="全局搜索"
          :title="`“${normalizedQuery || '未输入关键词'}”`"
          :description="heroText"
          variant="primary"
        >
          <template #meta>
            <div v-if="normalizedQuery" class="search-stats">
              <span class="search-stat">
                <strong>{{ discussionTotal }}</strong>
                <span>讨论</span>
              </span>
              <span class="search-stat">
                <strong>{{ postTotal }}</strong>
                <span>帖子</span>
              </span>
              <span class="search-stat">
                <strong>{{ userTotal }}</strong>
                <span>用户</span>
              </span>
            </div>
          </template>
        </ForumHeroPanel>

        <ForumStateBlock v-if="!normalizedQuery">
          请输入关键词后再搜索。
        </ForumStateBlock>
        <ForumStateBlock v-else-if="loading">
          搜索中...
        </ForumStateBlock>
        <ForumStateBlock v-else-if="isEmpty">
          没有找到相关讨论、帖子或用户。
        </ForumStateBlock>
        <template v-else>
          <ForumSearchResultSection
            v-if="showDiscussions"
            title="讨论"
            :show-more="searchType === 'all' && discussionTotal > discussions.length"
            @show-more="changeType('discussions')"
          >
            <ForumSearchResultCard
              v-for="discussion in discussions"
              :key="`discussion-${discussion.id}`"
              :avatar-mode="Boolean(discussion.user?.avatar_url)"
              :avatar-url="discussion.user?.avatar_url || ''"
              :avatar-alt="discussion.user?.display_name || discussion.user?.username || ''"
              icon-class="far fa-comments"
              :title-html="getDiscussionTitleHtml(discussion)"
              :excerpt-html="getDiscussionExcerptHtml(discussion)"
              :meta-items="[
                discussion.user?.display_name || discussion.user?.username || '未知用户',
                `${discussion.comment_count || 0} 回复`,
                formatRelativeTime(discussion.last_posted_at || discussion.created_at)
              ]"
              @click="$router.push(buildDiscussionPath(discussion))"
            />
          </ForumSearchResultSection>

          <ForumSearchResultSection
            v-if="showPosts"
            title="帖子"
            :show-more="searchType === 'all' && postTotal > posts.length"
            @show-more="changeType('posts')"
          >
            <ForumSearchResultCard
              v-for="post in posts"
              :key="`post-${post.id}`"
              :avatar-mode="Boolean(post.user?.avatar_url)"
              :avatar-url="post.user?.avatar_url || ''"
              :avatar-alt="post.user?.display_name || post.user?.username || ''"
              icon-class="far fa-comment"
              :title-html="getPostTitleHtml(post)"
              :excerpt-html="getPostExcerptHtml(post)"
              :meta-items="[
                `#${post.number}`,
                post.user?.display_name || post.user?.username || '未知用户',
                formatRelativeTime(post.created_at)
              ]"
              @click="$router.push(`/d/${post.discussion_id}?near=${post.number}`)"
            />
          </ForumSearchResultSection>

          <ForumSearchResultSection
            v-if="showUsers"
            title="用户"
            :show-more="searchType === 'all' && userTotal > users.length"
            @show-more="changeType('users')"
          >
            <ForumSearchResultCard
              v-for="user in users"
              :key="`user-${user.id}`"
              avatar-mode
              :avatar-url="user.avatar_url || ''"
              :avatar-alt="user.username || ''"
              :avatar-text="user.avatar_url ? '' : (user.display_name || user.username || '?').charAt(0).toUpperCase()"
              :title-html="getUserTitleHtml(user)"
              :excerpt-html="getUserSubtitleHtml(user)"
              :meta-items="[
                `@${user.username}`,
                `${user.discussion_count || 0} 讨论`,
                `${user.comment_count || 0} 回复`
              ]"
              user-layout
              @click="$router.push(buildUserPath(user))"
            />
          </ForumSearchResultSection>

          <div v-if="searchType !== 'all' && totalPages > 1" class="pagination">
            <button type="button" class="page-btn" :disabled="page <= 1" @click="changePage(page - 1)">
              上一页
            </button>
            <span class="page-info">第 {{ page }} / {{ totalPages }} 页</span>
            <button type="button" class="page-btn" :disabled="page >= totalPages" @click="changePage(page + 1)">
              下一页
            </button>
          </div>
        </template>
      </main>
    </ForumPageWithSidebar>
  </div>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useComposerStore } from '@/stores/composer'
import ForumHeroPanel from '@/components/forum/ForumHeroPanel.vue'
import ForumPageWithSidebar from '@/components/forum/ForumPageWithSidebar.vue'
import ForumSearchResultCard from '@/components/forum/ForumSearchResultCard.vue'
import ForumSearchResultSection from '@/components/forum/ForumSearchResultSection.vue'
import ForumStartDiscussionButton from '@/components/forum/ForumStartDiscussionButton.vue'
import ForumStateBlock from '@/components/forum/ForumStateBlock.vue'
import { useSearchResultsPage } from '@/composables/useSearchResultsPage'
import { useStartDiscussionAction } from '@/composables/useStartDiscussionAction'
import {
  buildDiscussionPath,
  buildUserPath,
  formatRelativeTime
} from '@/utils/forum'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const composerStore = useComposerStore()
const { startDiscussion } = useStartDiscussionAction({
  authStore,
  composerStore,
  router
})
const {
  changePage,
  changeType,
  discussionTotal,
  discussions,
  filterItems,
  getDiscussionExcerptHtml,
  getDiscussionTitleHtml,
  getPostExcerptHtml,
  getPostTitleHtml,
  getUserSubtitleHtml,
  getUserTitleHtml,
  heroText,
  isEmpty,
  loading,
  normalizedQuery,
  page,
  postTotal,
  posts,
  searchType,
  showDiscussions,
  showPosts,
  showUsers,
  totalPages,
  userTotal,
  users
} = useSearchResultsPage({
  route,
  router
})

function handleStartDiscussion() {
  startDiscussion({
    source: 'search'
  })
}

</script>

<style scoped>
.search-page {
  background: var(--forum-bg-canvas);
  min-height: calc(100vh - 56px);
}

.search-filters {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-item {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: var(--forum-radius-sm);
  background: transparent;
  color: var(--forum-text-muted);
}

.filter-item:hover {
  background: var(--forum-bg-subtle);
}

.filter-item.active {
  background: var(--forum-primary-color);
  color: var(--forum-text-inverse);
}

.filter-item strong {
  font-size: 12px;
}

.search-content {
  padding: 24px 28px 40px;
}

.search-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 18px;
}

.search-stat {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 34px;
  padding: 0 12px;
  border-radius: var(--forum-radius-pill);
  background: rgba(255, 255, 255, 0.88);
  color: #4a5d70;
}

.search-stat strong {
  color: #263646;
  font-size: 15px;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 24px;
}

.page-btn {
  background: var(--forum-bg-elevated);
  border: 1px solid var(--forum-border-color);
  color: #44515e;
}

.page-btn:hover:not(:disabled) {
  border-color: var(--forum-primary-color);
  color: var(--forum-primary-color);
}

.page-info {
  color: #6d7c89;
  font-size: 13px;
}

</style>
