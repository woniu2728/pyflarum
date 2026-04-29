<template>
  <div class="discussion-detail-page">
    <div class="container">
      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="!discussion" class="error">讨论不存在</div>
      <div v-else class="layout">
        <!-- 主内容区 -->
        <main class="main-content">
          <DiscussionHero
            :discussion="discussion"
            :discussion-header-style="discussionHeaderStyle"
            :can-moderate-pending-discussion="canModeratePendingDiscussion"
            :can-edit-discussion="canEditDiscussion"
            :build-tag-path="buildTagPath"
            @moderate-discussion="moderateDiscussion"
            @edit-discussion="editDiscussion"
          />

          <DiscussionMobileActions
            ref="discussionMobileNavRef"
            :discussion="discussion"
            :auth-store="authStore"
            :is-suspended="isSuspended"
            :show-discussion-menu="showDiscussionMenu"
            :can-reply-from-menu="canReplyFromMenu"
            :has-active-composer="hasActiveComposer"
            :toggling-subscription="togglingSubscription"
            :can-edit-discussion="canEditDiscussion"
            :can-moderate-discussion-settings="canModerateDiscussionSettings"
            @menu-action="handleDiscussionMenuSelection"
          />

          <div v-if="hasPrevious" ref="previousTrigger" class="load-more load-previous">
            <button @click="loadPreviousPosts" class="secondary" :disabled="loadingPrevious">
              {{ loadingPrevious ? '加载中...' : '加载前面的回复' }}
            </button>
          </div>

          <!-- 帖子列表 -->
          <div class="posts">
            <template v-for="post in posts" :key="post.id">
              <div
                v-if="showUnreadDivider(post)"
                class="post-unread-divider"
              >
                <span>从这里开始是未读回复</span>
              </div>

              <DiscussionPostItem
                :post="post"
                :discussion="discussion"
                :auth-store="authStore"
                :is-target="highlightedPostNumber === post.number"
                :is-suspended="isSuspended"
                :is-post-menu-open="activePostMenuId === post.id"
                :like-pending="likePendingPostIds.includes(post.id)"
                :flag-pending="flagPendingPostIds.includes(post.id)"
                :can-like-post="canLikePost"
                :can-edit-post="canEditPost"
                :can-delete-post="canDeletePost"
                :can-report-post="canReportPost"
                :can-moderate-pending-post="canModeratePendingPost"
                :has-post-controls="hasPostControls"
                :build-user-path="buildUserPath"
                :get-user-display-name="getUserDisplayName"
                :get-user-avatar-color="getUserAvatarColor"
                :get-user-initial="getUserInitial"
                :get-user-primary-group-icon="getUserPrimaryGroupIcon"
                :get-user-primary-group-color="getUserPrimaryGroupColor"
                :get-user-primary-group-label="getUserPrimaryGroupLabel"
                :format-absolute-date="formatAbsoluteDate"
                :format-date="formatDate"
                :format-like-summary="formatLikeSummary"
                @jump-to-post="jumpToPost"
                @toggle-like="toggleLike"
                @reply-to-post="replyToPost"
                @toggle-post-menu="togglePostMenu"
                @edit-post="editPost"
                @delete-post="deletePost"
                @open-report-modal="handleOpenReportModal"
                @moderate-post="({ post: targetPost, action }) => moderatePost(targetPost, action)"
                @resolve-post-flags="({ post: targetPost, status }) => resolvePostFlags(targetPost, status)"
                @close-post-menu="activePostMenuId = null"
              />
            </template>
          </div>

          <!-- 加载更多 -->
          <div v-if="hasMore" ref="nextTrigger" class="load-more">
            <button @click="loadMorePosts" class="secondary" :disabled="loadingMore">
              {{ loadingMore ? '加载中...' : '加载更多' }}
            </button>
          </div>

          <DiscussionReplyState
            :auth-store="authStore"
            :discussion="discussion"
            :is-suspended="isSuspended"
            :suspension-notice="suspensionNotice"
            :has-active-composer="hasActiveComposer"
            @open-composer="openComposer"
          />
        </main>

        <DiscussionSidebar
          v-if="discussion"
          ref="discussionSidebarRef"
          :discussion="discussion"
          :auth-store="authStore"
          :is-suspended="isSuspended"
          :suspension-notice="suspensionNotice"
          :has-active-composer="hasActiveComposer"
          :can-show-discussion-menu="canShowDiscussionMenu"
          :can-edit-discussion="canEditDiscussion"
          :can-moderate-discussion-settings="canModerateDiscussionSettings"
          :show-discussion-menu="showDiscussionMenu"
          :toggling-subscription="togglingSubscription"
          :scrubber-scrollbar-style="scrubberScrollbarStyle"
          :scrubber-before-percent="scrubberBeforePercent"
          :scrubber-after-percent="scrubberAfterPercent"
          :scrubber-handle-percent="scrubberHandlePercent"
          :scrubber-dragging="scrubberDragging"
          :unread-count="unreadCount"
          :unread-top-percent="unreadTopPercent"
          :unread-height-percent="unreadHeightPercent"
          :scrubber-position-text="scrubberPositionText"
          :scrubber-description="scrubberDescription"
          :max-post-number="maxPostNumber"
          @primary-action="openComposer"
          @login-action="goToLoginForReply"
          @toggle-subscription="toggleSubscription"
          @toggle-menu="toggleDiscussionMenu"
          @menu-action="handleDiscussionMenuSelection"
          @jump-to-post="jumpToPost"
          @scrubber-track-click="handleScrubberTrackClick"
          @scrubber-handle-pointerdown="handleScrubberMouseDown"
        />
      </div>
    </div>

  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useComposerStore } from '@/stores/composer'
import { useModalStore } from '@/stores/modal'
import DiscussionHero from '@/components/discussion/DiscussionHero.vue'
import DiscussionMobileActions from '@/components/discussion/DiscussionMobileActions.vue'
import DiscussionPostItem from '@/components/discussion/DiscussionPostItem.vue'
import DiscussionReplyState from '@/components/discussion/DiscussionReplyState.vue'
import DiscussionSidebar from '@/components/discussion/DiscussionSidebar.vue'
import { useDiscussionDetailInteractions } from '@/composables/useDiscussionDetailInteractions'
import { useDiscussionDetailPage } from '@/composables/useDiscussionDetailPage'
import {
  buildTagPath,
  buildUserPath,
  getUserAvatarColor,
  getUserDisplayName,
  getUserInitial
} from '@/utils/forum'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const composerStore = useComposerStore()
const modalStore = useModalStore()

const {
  activePostMenuId,
  discussion,
  discussionMobileNavRef,
  discussionSidebarRef,
  hasActiveComposer,
  hasMore,
  hasPrevious,
  handleScrubberMouseDown,
  handleScrubberTrackClick,
  highlightedPostNumber,
  jumpToPost,
  loadMorePosts,
  loading,
  loadingMore,
  loadingPrevious,
  loadPreviousPosts,
  maxPostNumber,
  nextTrigger,
  posts,
  previousTrigger,
  refreshDiscussion,
  scrollToPost,
  scrubberAfterPercent,
  scrubberBeforePercent,
  scrubberDescription,
  scrubberDragging,
  scrubberHandlePercent,
  scrubberPositionText,
  scrubberScrollbarStyle,
  showDiscussionMenu,
  showUnreadDivider,
  toggleDiscussionMenu,
  togglePostMenu,
  totalPosts,
  unreadCount,
  unreadHeightPercent,
  unreadTopPercent,
  upsertPost
} = useDiscussionDetailPage({
  authStore,
  composerStore,
  route,
  router
})
const {
  canDeletePost,
  canEditDiscussion,
  canEditPost,
  canLikePost,
  canModerateDiscussionSettings,
  canModeratePendingDiscussion,
  canModeratePendingPost,
  canReplyFromMenu,
  canReportPost,
  canShowDiscussionMenu,
  deleteDiscussion,
  deletePost,
  editDiscussion,
  editPost,
  flagPendingPostIds,
  formatAbsoluteDate,
  formatDate,
  formatLikeSummary,
  goToLoginForReply,
  isSuspended,
  likePendingPostIds,
  moderateDiscussion,
  moderatePost,
  openComposer,
  openReportModal,
  replyToPost,
  resolvePostFlags,
  suspensionNotice,
  toggleHide,
  toggleLike,
  toggleLock,
  togglePin,
  toggleSubscription,
  togglingSubscription
} = useDiscussionDetailInteractions({
  authStore,
  composerStore,
  discussion,
  hasActiveComposer,
  modalStore,
  posts,
  refreshDiscussion,
  route,
  router,
  scrollToPost,
  totalPosts,
  upsertPost
})
const discussionHeroColor = computed(() => {
  const primaryTag = discussion.value?.tags?.find(tag => tag?.color)
  return primaryTag?.color || '#f2554b'
})
const discussionHeaderStyle = computed(() => {
  const color = discussionHeroColor.value
  return {
    '--discussion-hero-color': color,
    '--discussion-hero-color-dark': shadeColor(color, -12),
    '--discussion-hero-contrast': getContrastColor(color)
  }
})

function getUserPrimaryGroup(user) {
  return user?.primary_group || null
}

function getUserPrimaryGroupIcon(user) {
  return getUserPrimaryGroup(user)?.icon || ''
}

function getUserPrimaryGroupColor(user) {
  return getUserPrimaryGroup(user)?.color || 'var(--forum-primary-color)'
}

function getUserPrimaryGroupLabel(user) {
  return getUserPrimaryGroup(user)?.name || ''
}

function getContrastColor(color) {
  const hex = String(color || '').trim().replace('#', '')
  if (!/^[\da-fA-F]{6}$/.test(hex)) return '#ffffff'

  const red = parseInt(hex.slice(0, 2), 16)
  const green = parseInt(hex.slice(2, 4), 16)
  const blue = parseInt(hex.slice(4, 6), 16)
  const brightness = (red * 299 + green * 587 + blue * 114) / 1000

  return brightness >= 150 ? '#223245' : '#ffffff'
}

function shadeColor(color, percent) {
  const hex = String(color || '').trim().replace('#', '')
  if (!/^[\da-fA-F]{6}$/.test(hex)) return color || '#f2554b'

  const amount = Number(percent) / 100
  const channel = start => {
    const value = parseInt(hex.slice(start, start + 2), 16)
    const adjusted = amount >= 0
      ? value + (255 - value) * amount
      : value * (1 + amount)
    return Math.max(0, Math.min(255, Math.round(adjusted)))
      .toString(16)
      .padStart(2, '0')
  }

  return `#${channel(0)}${channel(2)}${channel(4)}`
}

async function handleDiscussionMenuSelection(action) {
  const actionMap = {
    reply: openComposer,
    login: goToLoginForReply,
    'toggle-subscription': toggleSubscription,
    edit: editDiscussion,
    'toggle-pin': togglePin,
    'toggle-lock': toggleLock,
    'toggle-hide': toggleHide,
    delete: deleteDiscussion
  }
  const handler = actionMap[action]
  if (!handler) return
  await handleDiscussionMenuAction(handler)
}

function hasPostControls(post) {
  return canEditPost(post) || canDeletePost(post) || canReportPost(post)
}

async function handleDiscussionMenuAction(action) {
  showDiscussionMenu.value = false
  await action()
}

async function handleOpenReportModal(post) {
  activePostMenuId.value = null
  await openReportModal(post)
}
</script>

<style scoped>
.discussion-detail-page {
  padding: var(--forum-space-7) 0;
  background: var(--forum-bg-canvas);
  min-height: calc(100vh - 200px);
}

.layout {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: var(--forum-space-7);
}

.main-content {
  background: var(--forum-bg-elevated);
  padding: var(--forum-space-7);
  border-radius: var(--forum-radius-md);
  box-shadow: var(--forum-shadow-sm);
}

.posts {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin-bottom: 30px;
}

.post-unread-divider {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 10px 0 4px;
  color: var(--forum-accent-strong);
  font-size: var(--forum-font-size-xs);
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.post-unread-divider::before,
.post-unread-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: rgba(231, 103, 46, 0.28);
}

.load-more {
  text-align: center;
  margin-bottom: 30px;
}

.load-previous {
  margin-top: -10px;
}

.loading, .error {
  text-align: center;
  padding: 60px 20px;
  color: var(--forum-text-muted);
}

@media (max-width: 768px) {
  .discussion-detail-page {
    padding: 0 0 24px;
  }

  .layout {
    display: block;
  }

  .main-content {
    padding: 0 0 20px;
    border-radius: 0;
    background: var(--forum-bg-elevated);
  }

  .sidebar {
    display: none;
  }

  .posts,
  .load-more {
    margin-left: 15px;
    margin-right: 15px;
  }
}
</style>
