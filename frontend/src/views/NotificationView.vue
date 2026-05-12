<template>
  <div class="notification-page">
    <ForumPageWithSidebar>
      <template #sidebar>
        <DiscussionListSidebarStartButton
          v-if="!authStore.isAuthenticated || authStore.canStartDiscussion"
          :current-tag="null"
          :start-discussion-button-style="{}"
          @click="handleStartDiscussion"
        />

        <ForumPrimaryNav :auth-store="authStore" :notification-store="notificationStore" active-key="notifications" />
      </template>

      <main class="notification-content">
        <ForumHeroPanel
          :title="heroTitleText"
          :pill="heroPillText"
          :description="heroDescriptionText"
          variant="primary"
        >
          <template #meta>
            <div class="hero-meta">
              <button
                v-if="filteredUnreadCount > 0"
                type="button"
                class="secondary"
                :disabled="marking"
                @click="markAllAsRead"
              >
                {{ markAllButtonText }}
              </button>
              <button
                v-if="filteredReadCount > 0"
                type="button"
                class="secondary"
                :disabled="marking"
                @click="clearReadNotifications"
              >
                {{ clearReadButtonText }}
              </button>
              <button
                type="button"
                class="secondary"
                @click="toggleUnreadOnly"
              >
                {{ unreadToggleText }}
              </button>
              <router-link to="/profile" class="preferences-link">
                {{ preferencesLinkText }}
              </router-link>
            </div>
          </template>
        </ForumHeroPanel>

        <ForumInlineMessage v-if="loadError" tone="danger">
          {{ loadError }}
        </ForumInlineMessage>

        <section class="notification-filters-card">
          <div class="notification-filters-header">
            <div>
              <h2>{{ activeNotificationLabel }}</h2>
              <p>{{ filterDescriptionText }}</p>
            </div>
            <div class="notification-view-toggle">
              <button
                v-for="item in viewModeItems"
                :key="item.value"
                type="button"
                class="notification-view-toggle-button"
                :class="{ 'is-active': viewMode === item.value }"
                @click="changeViewMode(item.value)"
              >
                {{ item.label }}
              </button>
            </div>
          </div>
          <ForumSearchFilterNav
            :items="notificationTypeItems"
            :active-value="activeType"
            @change="changeType"
          />
        </section>

        <ForumStateBlock v-if="loading" class="notification-state">{{ loadingStateText }}</ForumStateBlock>

        <ForumStateBlock v-else-if="notifications.length === 0" class="notification-state">
          {{ emptyStateText }}
        </ForumStateBlock>

        <ForumNotificationList
          v-else-if="viewMode === 'timeline'"
          :notifications="notifications"
          :format-date="formatDate"
          :get-avatar-color="getNotificationAvatarColor"
          :get-avatar-initial="getNotificationAvatarInitial"
          :get-display-name="getUserDisplayName"
          :get-icon-class="getNotificationIconClass"
          :get-message-html="getNotificationMessageHtml"
          :get-presentation="getNotificationPresentation"
          @click="handleNotificationClick"
          @mark-read="markAsRead"
          @delete="deleteNotification"
        />

        <div v-else class="notification-group-stack">
          <section
            v-for="group in groupedNotifications"
            :key="group.key"
            class="notification-group-panel"
          >
            <header class="notification-group-panel-header">
              <div>
                <h3>{{ group.title }}</h3>
                <p>{{ groupCountText(group.items.length) }}</p>
              </div>
              <button
                v-if="group.discussionId"
                type="button"
                class="secondary"
                @click="router.push(`/d/${group.discussionId}`)"
              >
                {{ openDiscussionText }}
              </button>
            </header>

            <div v-if="group.discussionId" class="notification-group-panel-actions">
              <button
                v-if="group.items.some(item => !item.is_read)"
                type="button"
                class="secondary"
                :disabled="marking"
                @click="markGroupAsRead(group)"
              >
                {{ markGroupReadText }}
              </button>
              <button
                v-if="group.items.some(item => item.is_read)"
                type="button"
                class="secondary danger"
                :disabled="marking"
                @click="clearGroupReadNotifications(group)"
              >
                {{ clearGroupReadText }}
              </button>
            </div>

            <ForumNotificationList
              :notifications="group.items"
              :format-date="formatDate"
              :get-avatar-color="getNotificationAvatarColor"
              :get-avatar-initial="getNotificationAvatarInitial"
              :get-display-name="getUserDisplayName"
              :get-icon-class="getNotificationIconClass"
              :get-message-html="getNotificationMessageHtml"
              :get-presentation="getNotificationPresentation"
              @click="handleNotificationClick"
              @mark-read="markAsRead"
              @delete="deleteNotification"
            />
          </section>
        </div>

        <ForumPagination
          v-if="totalPages > 1"
          :current-page="currentPage"
          :total-pages="totalPages"
          @change="changePage"
        />
      </main>
    </ForumPageWithSidebar>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  getNotificationIconClass,
  getNotificationPresentationModel,
  getNotificationTextHtml
} from '@/composables/useNotificationPresentation'
import ForumHeroPanel from '@/components/forum/ForumHeroPanel.vue'
import ForumInlineMessage from '@/components/forum/ForumInlineMessage.vue'
import ForumNotificationList from '@/components/forum/ForumNotificationList.vue'
import ForumPagination from '@/components/forum/ForumPagination.vue'
import ForumPageWithSidebar from '@/components/forum/ForumPageWithSidebar.vue'
import ForumPrimaryNav from '@/components/forum/ForumPrimaryNav.vue'
import ForumSearchFilterNav from '@/components/forum/ForumSearchFilterNav.vue'
import ForumStateBlock from '@/components/forum/ForumStateBlock.vue'
import DiscussionListSidebarStartButton from '@/components/discussion/DiscussionListSidebarStartButton.vue'
import { useNotificationPage } from '@/composables/useNotificationPage'
import { useComposerStore } from '@/stores/composer'
import { useAuthStore } from '@/stores/auth'
import { useModalStore } from '@/stores/modal'
import { useNotificationStore } from '@/stores/notification'
import { useStartDiscussionAction } from '@/composables/useStartDiscussionAction'
import { getUiCopy } from '@/forum/registry'
import {
  formatRelativeTime,
  getUserAvatarColor,
  getUserDisplayName,
  getUserInitial
} from '@/utils/forum'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const composerStore = useComposerStore()
const modalStore = useModalStore()
const notificationStore = useNotificationStore()
const { startDiscussion } = useStartDiscussionAction({
  authStore,
  composerStore,
  router
})
const {
  notifications,
  emptyStateText,
  loadingStateText,
  loading,
  loadError,
  marking,
  currentPage,
  totalPages,
  activeType,
  unreadOnly,
  viewMode,
  filteredUnreadCount,
  filteredReadCount,
  hasActiveFilter,
  notificationTypeItems,
  viewModeItems,
  groupedNotifications,
  markAsRead,
  markAllAsRead,
  clearReadNotifications,
  markGroupAsRead,
  clearGroupReadNotifications,
  deleteNotification,
  handleNotificationClick,
  changeType,
  changeViewMode,
  toggleUnreadOnly,
  changePage
} = useNotificationPage({
  modalStore,
  notificationStore,
  route,
  router
})

const activeNotificationLabel = computed(() => {
  const activeItem = notificationTypeItems.value.find(item => item.value === activeType.value)
  return getUiCopy({
    surface: 'notification-page-active-filter-label',
    label: activeItem?.label || '',
    value: activeType.value,
  })?.text || activeItem?.label || '全部通知'
})
const heroTitleText = computed(() => getUiCopy({
  surface: 'notification-page-hero-title',
})?.text || '通知')
const heroPillText = computed(() => getUiCopy({
  surface: 'notification-page-hero-pill',
})?.text || '消息中心')
const heroDescriptionText = computed(() => getUiCopy({
  surface: 'notification-page-hero-description',
})?.text || '这里会显示回复、提及、点赞、审核和账号状态相关通知。')
const markAllButtonText = computed(() => getUiCopy({
  surface: 'notification-page-mark-all',
  marking: marking.value,
  hasActiveFilter: hasActiveFilter.value,
})?.text || (marking.value ? '处理中...' : (hasActiveFilter.value ? '当前筛选标记已读' : '全部标记为已读')))
const clearReadButtonText = computed(() => getUiCopy({
  surface: 'notification-page-clear-read',
  marking: marking.value,
  hasActiveFilter: hasActiveFilter.value,
})?.text || (marking.value ? '处理中...' : (hasActiveFilter.value ? '当前筛选清除已读' : '当前页清除已读')))
const unreadToggleText = computed(() => getUiCopy({
  surface: 'notification-page-unread-toggle',
  unreadOnly: unreadOnly.value,
})?.text || (unreadOnly.value ? '查看全部通知' : '仅看未读'))
const preferencesLinkText = computed(() => getUiCopy({
  surface: 'notification-page-preferences-link',
})?.text || '通知偏好前往个人设置')
const filterDescriptionText = computed(() => getUiCopy({
  surface: 'notification-page-filter-description',
})?.text || '按通知类型筛选消息流，方便集中处理提及、点赞、审核和账号状态通知。')
const openDiscussionText = computed(() => getUiCopy({
  surface: 'notification-page-open-discussion',
})?.text || '打开讨论')
const markGroupReadText = computed(() => getUiCopy({
  surface: 'notification-page-mark-group-read',
})?.text || '整组标记已读')
const clearGroupReadText = computed(() => getUiCopy({
  surface: 'notification-page-clear-group-read',
})?.text || '整组清理已读')

function handleStartDiscussion() {
  startDiscussion({
    source: 'notifications'
  })
}

function formatDate(dateString) {
  return formatRelativeTime(dateString)
}

function groupCountText(count) {
  return getUiCopy({
    surface: 'notification-page-group-count',
    count,
  })?.text || `${count} 条通知`
}

function getNotificationMessageHtml(notification) {
  return getNotificationTextHtml(notification)
}

function getNotificationPresentation(notification) {
  return getNotificationPresentationModel(notification)
}

function getNotificationAvatarInitial(notification) {
  return getUserInitial(notification.from_user || {})
}

function getNotificationAvatarColor(notification) {
  return getUserAvatarColor(notification.from_user || {})
}
</script>

<style scoped>
.notification-page {
  background: var(--forum-bg-canvas);
  min-height: calc(100vh - 56px);
}

.notification-content {
  padding: 24px 28px 40px;
}

.notification-filters-card {
  margin: 18px 0;
  padding: 18px;
  border: 1px solid #dde6ee;
  border-radius: 14px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(247, 250, 252, 0.98));
  box-shadow: 0 14px 36px rgba(20, 36, 54, 0.06);
}

.notification-filters-header {
  margin-bottom: 14px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.notification-filters-header h2 {
  margin: 0;
  font-size: 18px;
  color: #1f2f3d;
}

.notification-filters-header p {
  margin: 6px 0 0;
  font-size: 13px;
  color: #6d7d8c;
}

.notification-view-toggle {
  display: inline-flex;
  gap: 8px;
  padding: 4px;
  border-radius: 999px;
  background: #edf3f8;
}

.notification-view-toggle-button {
  border: 0;
  background: transparent;
  color: #5e7287;
  border-radius: 999px;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 600;
}

.notification-view-toggle-button.is-active {
  background: #fff;
  color: #23384c;
  box-shadow: 0 6px 16px rgba(41, 57, 75, 0.12);
}

.notification-group-stack {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.notification-group-panel {
  border: 1px solid #dde6ee;
  border-radius: 16px;
  padding: 16px;
  background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.98));
  box-shadow: 0 12px 30px rgba(20, 36, 54, 0.06);
}

.notification-group-panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}

.notification-group-panel-header h3 {
  margin: 0;
  font-size: 16px;
  color: #213243;
}

.notification-group-panel-header p {
  margin: 6px 0 0;
  font-size: 12px;
  color: #758698;
}

.notification-group-panel-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 14px;
}

.hero-meta {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.secondary.danger {
  color: #a44d47;
}

.preferences-link {
  color: var(--forum-text-muted);
  font-size: 13px;
  font-weight: 500;
  overflow-wrap: anywhere;
}

.preferences-link:hover {
  color: var(--forum-primary-color);
  text-decoration: none;
}

.notification-state {
  margin: 0;
}

@media (max-width: 900px) {
  .notification-content {
    padding: 18px 15px 28px;
  }

  .notification-filters-card {
    padding: 16px;
  }
}

@media (max-width: 768px) {
  .hero-meta {
    align-items: stretch;
  }

  .notification-group-panel-header {
    flex-direction: column;
  }
}

@media (max-width: 520px) {
  .notification-content {
    padding: 16px 12px 28px;
  }
}
</style>
