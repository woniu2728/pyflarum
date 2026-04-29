<template>
  <div id="app">
    <template v-if="showMaintenance">
      <main class="maintenance-shell">
        <section class="maintenance-card">
          <p class="maintenance-eyebrow">Maintenance Mode</p>
          <h1>论坛暂时不可用</h1>
          <p>{{ forumStore.settings.maintenance_message }}</p>
        </section>
      </main>
    </template>
    <template v-else>
      <Header />
      <main class="main-content">
        <router-view />
      </main>
      <Footer />
      <AppModalHost />
      <DiscussionComposer />
      <PostComposer />
    </template>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import Header from './components/Header.vue'
import Footer from './components/Footer.vue'
import AppModalHost from './components/AppModalHost.vue'
import DiscussionComposer from './components/DiscussionComposer.vue'
import PostComposer from './components/PostComposer.vue'
import { useAuthStore } from './stores/auth'
import { useComposerStore } from './stores/composer'
import { useForumStore } from './stores/forum'
import { useNotificationStore } from './stores/notification'
import { openLoginModal } from './utils/authModal'

const authStore = useAuthStore()
const composerStore = useComposerStore()
const forumStore = useForumStore()
const notificationStore = useNotificationStore()
const route = useRoute()
const showMaintenance = computed(() => forumStore.settings.maintenance_mode && !authStore.user?.is_staff)

function handleBeforeUnload(event) {
  if (!composerStore.hasUnsavedChanges) return
  event.preventDefault()
  event.returnValue = composerStore.unsavedMessage || ''
}

async function syncNotificationState() {
  try {
    await notificationStore.fetchStats()
  } catch (error) {
    console.error('同步通知角标失败:', error)
  }

  notificationStore.connect()
}

function handleAuthRequired(event) {
  authStore.logout()

  const redirect = event?.detail?.redirect || route.fullPath
  openLoginModal({ redirectPath: redirect })
}

function handleAuthInvalidated() {
  authStore.logout()
}

onMounted(async () => {
  await forumStore.initialize()

  window.addEventListener('beforeunload', handleBeforeUnload)
  window.addEventListener('bias:auth-required', handleAuthRequired)
  window.addEventListener('bias:auth-invalidated', handleAuthInvalidated)

  // 初始化认证状态
  await authStore.checkAuth()

  if (showMaintenance.value) {
    return
  }

  // 如果已登录，连接WebSocket
  if (authStore.isAuthenticated) {
    await syncNotificationState()
  }
})

watch(
  () => authStore.isAuthenticated,
  async isAuthenticated => {
    if (showMaintenance.value) {
      notificationStore.disconnect()
      notificationStore.resetState()
      return
    }

    if (isAuthenticated) {
      await syncNotificationState()
      return
    }

    notificationStore.disconnect()
    notificationStore.resetState()
  }
)

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
  window.removeEventListener('bias:auth-required', handleAuthRequired)
  window.removeEventListener('bias:auth-invalidated', handleAuthInvalidated)
})
</script>

<style>
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.maintenance-shell {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 32px 20px;
  background:
    radial-gradient(circle at top, rgba(77, 105, 142, 0.18), transparent 48%),
    linear-gradient(180deg, #f6f8fb 0%, #eef2f7 100%);
}

.maintenance-card {
  width: min(560px, 100%);
  padding: 36px 32px;
  border: 1px solid rgba(77, 105, 142, 0.16);
  border-radius: var(--forum-radius-lg);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: var(--forum-shadow-lg);
}

.maintenance-card h1 {
  margin-bottom: 14px;
  font-size: var(--forum-font-size-3xl);
  color: #223041;
}

.maintenance-card p {
  color: #4f5f70;
  font-size: 15px;
}

.maintenance-eyebrow {
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 12px;
  font-weight: 700;
  color: #4d698e;
}

.main-content {
  flex: 1;
  padding-bottom: var(--composer-offset);
  transition: padding-bottom 0.15s ease;
}
</style>
