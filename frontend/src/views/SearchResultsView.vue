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
          <section v-if="showDiscussions" class="result-section">
            <div class="section-header">
              <h2>讨论</h2>
              <button
                v-if="searchType === 'all' && discussionTotal > discussions.length"
                type="button"
                class="section-link"
                @click="changeType('discussions')"
              >
                查看全部
              </button>
            </div>
            <div class="result-list">
              <article
                v-for="discussion in discussions"
                :key="`discussion-${discussion.id}`"
                class="result-card"
                @click="$router.push(buildDiscussionPath(discussion))"
              >
                <div class="result-card-icon" :class="{ 'result-card-icon--avatar': discussion.user?.avatar_url }">
                  <img
                    v-if="discussion.user?.avatar_url"
                    :src="discussion.user.avatar_url"
                    :alt="discussion.user.display_name || discussion.user.username"
                    class="result-avatar"
                  />
                  <i v-else class="far fa-comments"></i>
                </div>
                <div class="result-card-main">
                  <h3 v-html="getDiscussionTitleHtml(discussion)"></h3>
                  <p v-html="getDiscussionExcerptHtml(discussion)"></p>
                  <div class="result-meta">
                    <span>{{ discussion.user?.display_name || discussion.user?.username || '未知用户' }}</span>
                    <span>{{ discussion.comment_count || 0 }} 回复</span>
                    <span>{{ formatRelativeTime(discussion.last_posted_at || discussion.created_at) }}</span>
                  </div>
                </div>
              </article>
            </div>
          </section>

          <section v-if="showPosts" class="result-section">
            <div class="section-header">
              <h2>帖子</h2>
              <button
                v-if="searchType === 'all' && postTotal > posts.length"
                type="button"
                class="section-link"
                @click="changeType('posts')"
              >
                查看全部
              </button>
            </div>
            <div class="result-list">
              <article
                v-for="post in posts"
                :key="`post-${post.id}`"
                class="result-card"
                @click="$router.push(`/d/${post.discussion_id}?near=${post.number}`)"
              >
                <div class="result-card-icon" :class="{ 'result-card-icon--avatar': post.user?.avatar_url }">
                  <img
                    v-if="post.user?.avatar_url"
                    :src="post.user.avatar_url"
                    :alt="post.user.display_name || post.user.username"
                    class="result-avatar"
                  />
                  <i v-else class="far fa-comment"></i>
                </div>
                <div class="result-card-main">
                  <h3 v-html="getPostTitleHtml(post)"></h3>
                  <p v-html="getPostExcerptHtml(post)"></p>
                  <div class="result-meta">
                    <span>#{{ post.number }}</span>
                    <span>{{ post.user?.display_name || post.user?.username || '未知用户' }}</span>
                    <span>{{ formatRelativeTime(post.created_at) }}</span>
                  </div>
                </div>
              </article>
            </div>
          </section>

          <section v-if="showUsers" class="result-section">
            <div class="section-header">
              <h2>用户</h2>
              <button
                v-if="searchType === 'all' && userTotal > users.length"
                type="button"
                class="section-link"
                @click="changeType('users')"
              >
                查看全部
              </button>
            </div>
            <div class="result-list">
              <article
                v-for="user in users"
                :key="`user-${user.id}`"
                class="result-card user-card"
                @click="$router.push(buildUserPath(user))"
              >
                <div class="result-card-icon result-card-icon--avatar">
                  <img
                    v-if="user.avatar_url"
                    :src="user.avatar_url"
                    :alt="user.username"
                    class="result-avatar"
                  />
                  <span v-else>{{ (user.display_name || user.username || '?').charAt(0).toUpperCase() }}</span>
                </div>
                <div class="result-card-main">
                  <h3 v-html="getUserTitleHtml(user)"></h3>
                  <p v-html="getUserSubtitleHtml(user)"></p>
                  <div class="result-meta">
                    <span>@{{ user.username }}</span>
                    <span>{{ user.discussion_count || 0 }} 讨论</span>
                    <span>{{ user.comment_count || 0 }} 回复</span>
                  </div>
                </div>
              </article>
            </div>
          </section>

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
import ForumStartDiscussionButton from '@/components/forum/ForumStartDiscussionButton.vue'
import ForumStateBlock from '@/components/forum/ForumStateBlock.vue'
import { useSearchResultsPage } from '@/composables/useSearchResultsPage'
import {
  buildDiscussionPath,
  buildUserPath,
  formatRelativeTime
} from '@/utils/forum'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const composerStore = useComposerStore()
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
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }
  if (!authStore.canStartDiscussion) return

  composerStore.openDiscussionComposer({
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

.result-section + .result-section {
  margin-top: 20px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.section-header h2 {
  font-size: 20px;
  color: var(--forum-text-color);
}

.section-link {
  padding: 0;
  background: transparent;
  color: var(--forum-primary-color);
  font-size: 13px;
  font-weight: 600;
}

.result-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.result-card {
  display: flex;
  gap: 14px;
  padding: 18px 20px;
  background: var(--forum-bg-elevated);
  border: 1px solid var(--forum-border-color);
  border-radius: var(--forum-radius-md);
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
  box-shadow: var(--forum-shadow-sm);
}

.result-card:hover {
  border-color: color-mix(in srgb, var(--forum-primary-color) 28%, white);
  box-shadow: var(--forum-shadow-md);
  transform: translateY(-1px);
}

.result-card-icon {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--forum-primary-color) 12%, white);
  color: var(--forum-primary-color);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}

.result-card-icon--avatar {
  background: #eef3f7;
  color: #506274;
}

.result-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.result-card-main {
  min-width: 0;
}

.result-card-main h3 {
  font-size: 17px;
  color: var(--forum-text-color);
  margin-bottom: 6px;
  line-height: 1.45;
}

.result-card-main p {
  color: var(--forum-text-muted);
  line-height: 1.7;
  margin-bottom: 8px;
}

.result-card-main :deep(mark) {
  background: rgba(255, 220, 126, 0.55);
  color: inherit;
  padding: 0 2px;
  border-radius: 4px;
}

.result-meta {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  color: var(--forum-text-soft);
  font-size: 12px;
}

.user-card {
  align-items: center;
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
