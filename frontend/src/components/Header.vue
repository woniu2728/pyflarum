<template>
  <header class="header">
    <div class="container">
      <div class="header-left">
        <button
          type="button"
          class="mobile-nav-toggle"
          :aria-expanded="showMobileDrawer"
          :aria-label="mobileLeftActionLabel"
          @click.stop="handleMobileLeftAction"
        >
          <i :class="mobileLeftActionIcon"></i>
        </button>
        <div class="logo">
          <router-link to="/">
            <img
              v-if="forumStore.settings.logo_url"
              :src="forumStore.settings.logo_url"
              :alt="forumStore.settings.forum_title"
              class="logo-image"
            />
            <span v-else>{{ forumStore.settings.forum_title }}</span>
          </router-link>
        </div>
      </div>

      <div class="mobile-header-title">
        {{ mobilePageTitle }}
      </div>

      <div class="header-right">
        <HeaderSearchBox
          :current-search-query="currentSearchQuery"
          :search-preview-text="searchPreviewText"
          @open-search="openSearchModal"
          @clear-search="clearSearch"
        />

        <button
          v-if="showMobileRightAction"
          type="button"
          class="mobile-primary-action"
          :aria-label="mobileRightActionLabel"
          @click="handleMobileRightAction"
        >
          <i :class="mobileRightActionIcon"></i>
        </button>

        <template v-if="authStore.isAuthenticated">
          <!-- 通知 -->
          <HeaderNotificationsMenu
            :show-notifications="showNotifications"
            :notification-store="notificationStore"
            :notification-items="notificationItems"
            :notification-groups="notificationGroups"
            :has-read-notifications="hasReadNotifications"
            :get-notification-icon-class="getNotificationIconClass"
            :get-notification-text-html="getNotificationTextHtml"
            :format-relative-time="formatRelativeTime"
            @toggle="toggleNotifications"
            @mark-all-read="markAllNotificationsAsRead"
            @clear-read="clearReadNotifications"
            @open-group="openNotificationGroup"
            @notification-click="handleNotificationClick"
            @open-page="openNotificationsPage"
          />

          <!-- 用户菜单 -->
          <HeaderUserMenu
            :auth-store="authStore"
            :show-user-menu="showUserMenu"
            :profile-path="profilePath"
            :get-user-avatar-color="getUserAvatarColor"
            :get-user-initial="getUserInitial"
            @toggle="toggleUserMenu"
            @logout="handleLogout"
          />
        </template>

        <template v-else>
          <button type="button" class="btn-login" @click="openLogin">
            登录
          </button>
          <button type="button" class="btn-signup" @click="openRegister">
            注册
          </button>
        </template>
      </div>
    </div>

    <HeaderMobileDrawer
      :show-mobile-drawer="showMobileDrawer"
      :auth-store="authStore"
      :forum-store="forumStore"
      :notification-store="notificationStore"
      :current-search-query="currentSearchQuery"
      :is-mobile-nav-active="isMobileNavActive"
      :profile-path="profilePath"
      :get-user-avatar-color="getUserAvatarColor"
      :get-user-initial="getUserInitial"
      @close="closeMobileDrawer"
      @open-search="openSearchFromDrawer"
      @start-discussion="startDiscussionFromDrawer"
      @logout="logoutFromDrawer"
      @open-login="openLoginFromDrawer"
      @open-register="openRegisterFromDrawer"
    />
  </header>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import HeaderMobileDrawer from '@/components/header/HeaderMobileDrawer.vue'
import HeaderNotificationsMenu from '@/components/header/HeaderNotificationsMenu.vue'
import HeaderSearchBox from '@/components/header/HeaderSearchBox.vue'
import HeaderUserMenu from '@/components/header/HeaderUserMenu.vue'
import { useAuthStore } from '@/stores/auth'
import { useComposerStore } from '@/stores/composer'
import { useForumStore } from '@/stores/forum'
import { useModalStore } from '@/stores/modal'
import { useNotificationStore } from '@/stores/notification'
import { renderTwemojiText } from '@/utils/twemoji'
import { openLoginModal, openRegisterModal } from '@/utils/authModal'
import { useRoute, useRouter } from 'vue-router'
import api from '@/api'
import GlobalSearchModal from '@/components/modals/GlobalSearchModal.vue'
import {
  buildDiscussionPath,
  buildUserPath,
  formatRelativeTime,
  getUserAvatarColor,
  getUserInitial
} from '@/utils/forum'

const authStore = useAuthStore()
const composerStore = useComposerStore()
const forumStore = useForumStore()
const modalStore = useModalStore()
const notificationStore = useNotificationStore()
const route = useRoute()
const router = useRouter()

const showUserMenu = ref(false)
const showNotifications = ref(false)
const showMobileDrawer = ref(false)
const mobileHeaderOverride = ref(null)

const notificationItems = computed(() => notificationStore.notifications.slice(0, 8))
const hasReadNotifications = computed(() => notificationItems.value.some(notification => notification.is_read))
const currentSearchQuery = computed(() => String(route.query.q ?? route.query.search ?? '').trim())
const searchPreviewText = computed(() => currentSearchQuery.value || '')
const isOwnProfileRoute = computed(() => {
  if (!authStore.user) return false

  return route.name === 'profile'
    || (route.name === 'user-profile' && String(route.params.id) === String(authStore.user.id))
})
const mobilePageTitle = computed(() => {
  if (mobileHeaderOverride.value?.title) {
    return mobileHeaderOverride.value.title
  }

  switch (route.name) {
    case 'home':
      return '全部讨论'
    case 'following':
      return '关注中'
    case 'tags':
      return '标签'
    case 'profile':
    case 'user-profile':
      return '个人主页'
    case 'notifications':
      return '通知'
    case 'search':
      return '搜索结果'
    case 'discussion-detail':
      return '讨论详情'
    case 'login':
      return '登录'
    case 'register':
      return '注册'
    default:
      return forumStore.settings.forum_title || 'Bias'
  }
})
const mobileLeftActionIcon = computed(() => mobileHeaderOverride.value?.leftAction === 'back' ? 'fas fa-angle-left' : 'fas fa-bars')
const mobileLeftActionLabel = computed(() => mobileHeaderOverride.value?.leftAction === 'back' ? '返回上一页' : '打开导航菜单')
const mobileRightActionType = computed(() => {
  if (mobileHeaderOverride.value?.rightAction) {
    return mobileHeaderOverride.value.rightAction
  }

  if (!authStore.isAuthenticated) return 'login'
  return authStore.canStartDiscussion ? 'compose-discussion' : 'none'
})
const showMobileRightAction = computed(() => mobileRightActionType.value !== 'none')
const mobileRightActionIcon = computed(() => {
  switch (mobileRightActionType.value) {
    case 'discussion-menu':
      return 'fas fa-ellipsis-v'
    case 'login':
      return 'fas fa-right-to-bracket'
    default:
      return 'fas fa-pen-to-square'
  }
})
const mobileRightActionLabel = computed(() => {
  switch (mobileRightActionType.value) {
    case 'discussion-menu':
      return '讨论操作菜单'
    case 'login':
      return '登录'
    default:
      return '发起讨论'
  }
})
const notificationGroups = computed(() => {
  const groups = []
  const seen = new Map()

  for (const notification of notificationItems.value) {
    const discussionId = notification.data?.discussion_id || 0
    const key = discussionId ? `discussion-${discussionId}` : 'general'

    if (!seen.has(key)) {
      const group = {
        key,
        discussionId,
        title: notification.data?.discussion_title || forumStore.settings.forum_title || '论坛',
        items: []
      }
      seen.set(key, group)
      groups.push(group)
    }

    seen.get(key).items.push(notification)
  }

  return groups
})

function profilePath() {
  return authStore.user ? buildUserPath(authStore.user) : '/profile'
}

function isMobileNavActive(key) {
  if (key === 'home') {
    return route.name === 'home' || route.name === 'tag-detail'
  }

  if (key === 'profile') {
    return isOwnProfileRoute.value
  }

  return route.name === key
}

function toggleUserMenu() {
  showNotifications.value = false
  showUserMenu.value = !showUserMenu.value
}

function toggleMobileDrawer() {
  showUserMenu.value = false
  showNotifications.value = false
  showMobileDrawer.value = !showMobileDrawer.value
}

function closeMobileDrawer() {
  showMobileDrawer.value = false
}

function handleMobileLeftAction() {
  if (mobileHeaderOverride.value?.leftAction === 'back') {
    if (window.history.length > 1) {
      router.back()
      return
    }

    router.push('/')
    return
  }

  toggleMobileDrawer()
}

function handleMobileRightAction() {
  switch (mobileRightActionType.value) {
    case 'discussion-menu':
      window.dispatchEvent(new CustomEvent('bias:mobile-header-action', {
        detail: { action: 'discussion-menu' }
      }))
      return
    case 'login':
      openLogin()
      return
    default:
      startDiscussionFromHeader()
  }
}

async function toggleNotifications() {
  showUserMenu.value = false
  showNotifications.value = !showNotifications.value

  if (!showNotifications.value) return

  try {
    await notificationStore.fetchNotifications({ limit: 8 })
  } catch (error) {
    console.error('加载通知失败:', error)
  }
}

async function markAllNotificationsAsRead() {
  try {
    await notificationStore.markAllAsRead()
  } catch (error) {
    console.error('全部标记已读失败:', error)
  }
}

async function clearReadNotifications() {
  try {
    await notificationStore.clearReadNotifications()
  } catch (error) {
    console.error('清除已读通知失败:', error)
  }
}

async function handleNotificationClick(notification) {
  try {
    if (!notification.is_read) {
      await notificationStore.markAsRead(notification.id)
    }
  } catch (error) {
    console.error('标记通知已读失败:', error)
  }

  showNotifications.value = false
  router.push(await resolveNotificationPath(notification))
}

async function resolveNotificationPath(notification) {
  const discussionId = notification.data?.discussion_id
  const postId = notification.data?.post_id
  const postNumber = notification.data?.post_number

  if (discussionId && postNumber) {
    return `/d/${discussionId}?near=${postNumber}`
  }

  if (discussionId && postId) {
    try {
      const post = await api.get(`/posts/${postId}`)
      if (post?.number) {
        return `/d/${discussionId}?near=${post.number}`
      }
    } catch (error) {
      console.error('解析通知跳转帖子失败:', error)
    }
  }

  if (discussionId) {
    return buildDiscussionPath(discussionId)
  }

  if (notification.type === 'userSuspended' || notification.type === 'userUnsuspended') {
    return '/profile'
  }

  return '/notifications'
}

function openNotificationGroup(group) {
  showNotifications.value = false
  router.push(group.discussionId ? buildDiscussionPath(group.discussionId) : '/notifications')
}

function openNotificationsPage() {
  showNotifications.value = false
  router.push('/notifications')
}

function startDiscussionFromHeader() {
  if (!authStore.canStartDiscussion) return
  composerStore.openDiscussionComposer({
    source: `header:${String(route.name || 'unknown')}`
  })
}

function startDiscussionFromDrawer() {
  closeMobileDrawer()
  startDiscussionFromHeader()
}

function openSearchFromDrawer() {
  closeMobileDrawer()
  openSearchModal()
}

function getNotificationIconClass(type) {
  switch (type) {
    case 'discussionReply':
      return 'fas fa-reply'
    case 'postLiked':
      return 'fas fa-thumbs-up'
    case 'userMentioned':
      return 'fas fa-at'
    case 'postReply':
      return 'fas fa-comment'
    case 'discussionApproved':
      return 'fas fa-circle-check'
    case 'discussionRejected':
      return 'fas fa-circle-xmark'
    case 'postApproved':
      return 'fas fa-check'
    case 'postRejected':
      return 'fas fa-xmark'
    case 'userSuspended':
      return 'fas fa-user-lock'
    case 'userUnsuspended':
      return 'fas fa-user-check'
    default:
      return 'fas fa-bell'
  }
}

function getNotificationText(notification) {
  const fromUser = notification.from_user?.display_name || notification.from_user?.username || '有人'

  switch (notification.type) {
    case 'discussionReply':
      return `${fromUser} 回复了你关注的讨论`
    case 'postLiked':
      return `${fromUser} 赞了你的回复`
    case 'userMentioned':
      return `${fromUser} 提到了你`
    case 'postReply':
      return `${fromUser} 回复了你的帖子`
    case 'discussionApproved':
      return `${fromUser} 通过了你的讨论`
    case 'discussionRejected':
      return `${fromUser} 拒绝了你的讨论`
    case 'postApproved':
      return `${fromUser} 通过了你的回复`
    case 'postRejected':
      return `${fromUser} 拒绝了你的回复`
    case 'userSuspended':
      return `${fromUser} 封禁了你的账号`
    case 'userUnsuspended':
      return `${fromUser} 解除了你的账号封禁`
    default:
      return notificationStore.getNotificationMessage(notification)
  }
}

function getNotificationTextHtml(notification) {
  return renderTwemojiText(getNotificationText(notification))
}

async function handleLogout() {
  if (composerStore.hasUnsavedChanges) {
    const confirmed = await modalStore.confirm({
      title: '确认登出',
      message: composerStore.unsavedMessage || '你有未保存内容，确定要登出吗？',
      confirmText: '继续登出',
      cancelText: '返回',
      tone: 'danger'
    })
    if (!confirmed) return
  }

  authStore.logout()
  notificationStore.disconnect()
  showUserMenu.value = false
  router.push('/')
}

watch(
  () => authStore.isAuthenticated,
  (isAuthenticated) => {
    if (!isAuthenticated) {
      showNotifications.value = false
    }
  },
  { immediate: true }
)

watch(
  () => route.fullPath,
  () => {
    showNotifications.value = false
    showUserMenu.value = false
    showMobileDrawer.value = false
    if (route.name !== 'discussion-detail') {
      mobileHeaderOverride.value = null
    }
  }
)

function handleMobileHeaderUpdate(event) {
  mobileHeaderOverride.value = event.detail || null
}

function handleMobileHeaderReset() {
  mobileHeaderOverride.value = null
}

function openSearchModal() {
  modalStore.show(
    GlobalSearchModal,
    {
      initialQuery: currentSearchQuery.value,
      initialType: String(route.query.type || 'all')
    },
    {
      size: 'large',
      className: 'Modal--search'
    }
  )
}

function openLogin() {
  openLoginModal({ redirectPath: route.fullPath })
}

function openRegister() {
  openRegisterModal({ redirectPath: route.fullPath })
}

function openLoginFromDrawer() {
  closeMobileDrawer()
  openLogin()
}

function openRegisterFromDrawer() {
  closeMobileDrawer()
  openRegister()
}

async function logoutFromDrawer() {
  closeMobileDrawer()
  await handleLogout()
}

function handleWindowClick(e) {
  if (!e.target.closest('.user-dropdown')) {
    showUserMenu.value = false
  }
  if (!e.target.closest('.notifications-dropdown')) {
    showNotifications.value = false
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('click', handleWindowClick)
}

onMounted(() => {
  if (typeof window === 'undefined') return
  window.addEventListener('bias:mobile-header-update', handleMobileHeaderUpdate)
  window.addEventListener('bias:mobile-header-reset', handleMobileHeaderReset)
})

function clearSearch() {
  if (route.name === 'search') {
    router.push('/')
    return
  }

  if (route.query.q || route.query.search) {
    const nextQuery = { ...route.query }
    delete nextQuery.q
    delete nextQuery.search
    delete nextQuery.type
    delete nextQuery.page

    router.push({
      path: route.path,
      query: nextQuery
    })
  }
}

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('click', handleWindowClick)
    window.removeEventListener('bias:mobile-header-update', handleMobileHeaderUpdate)
    window.removeEventListener('bias:mobile-header-reset', handleMobileHeaderReset)
  }
})
</script>

<style scoped>
.header {
  background: white;
  border-bottom: 1px solid #e3e8ed;
  position: sticky;
  top: 0;
  z-index: 100;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.logo a {
  display: inline-flex;
  align-items: center;
  font-size: 18px;
  font-weight: 600;
  color: var(--forum-primary-color);
  letter-spacing: -0.5px;
}

.logo a:hover {
  text-decoration: none;
}

.logo-image {
  max-height: 32px;
  max-width: 180px;
  object-fit: contain;
}

.nav {
  display: flex;
  gap: 5px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  color: #555;
  font-size: 14px;
  border-radius: 3px;
  transition: all 0.2s;
}

.nav-item i {
  font-size: 14px;
}

.nav-item:hover {
  background: #f5f8fa;
  color: #333;
  text-decoration: none;
}

.nav-item.router-link-active {
  color: #4d698e;
  font-weight: 500;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.mobile-nav-toggle,
.mobile-primary-action,
.mobile-header-title {
  display: none;
}

.mobile-nav-toggle,
.mobile-primary-action {
  width: 40px;
  height: 40px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: #62758a;
  align-items: center;
  justify-content: center;
}

/* 发帖按钮 */
.btn-compose {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 15px;
  background: #4d698e;
  color: white;
  border-radius: 3px;
  font-size: 13px;
  font-weight: 500;
  transition: background 0.2s;
}

.btn-compose:hover {
  background: #3d5875;
  text-decoration: none;
}

.btn-compose i {
  font-size: 13px;
}

/* 图标按钮 */
/* 登录/注册按钮 */
.btn-login,
.btn-signup {
  padding: 8px 15px;
  font-size: 13px;
  font-weight: 500;
  border-radius: 3px;
  transition: all 0.2s;
}

.btn-login {
  color: #555;
  background: transparent;
}

.btn-login:hover {
  background: #f5f8fa;
  text-decoration: none;
}

.btn-signup {
  background: var(--forum-primary-color);
  color: white;
}

.btn-signup:hover {
  filter: brightness(0.92);
  text-decoration: none;
}

@media (max-width: 768px) {
  .container {
    position: relative;
    padding: 0 10px;
  }

  .header-left {
    gap: 0;
  }

  .mobile-nav-toggle,
  .mobile-primary-action {
    display: inline-flex;
  }

  .mobile-header-title {
    display: block;
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    width: min(220px, calc(100vw - 120px));
    color: #de6c2b;
    font-size: 16px;
    font-weight: 400;
    line-height: 56px;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    pointer-events: none;
  }

  .logo,
  .search-box,
  .notifications-dropdown,
  .user-dropdown,
  .btn-login,
  .btn-signup {
    display: none;
  }

  .header-right {
    gap: 0;
  }

  .mobile-nav-toggle:hover,
  .mobile-primary-action:hover {
    background: #f4f7fa;
  }
}
</style>
