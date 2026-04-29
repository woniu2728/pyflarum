<template>
  <div class="home">
    <!-- Flarum风格：直接重定向到讨论列表 -->
    <div class="flarum-container">
      <div class="welcome-banner">
        <h1>Bias</h1>
        <p>基于Django和Vue 3的现代化论坛</p>
      </div>

      <div class="quick-actions">
        <router-link to="/discussions" class="action-btn primary">
          <span class="icon">💬</span>
          <span>浏览讨论</span>
        </router-link>
        <button v-if="authStore.canStartDiscussion" type="button" class="action-btn" @click="handleStartDiscussion">
          <span class="icon">✏️</span>
          <span>发起讨论</span>
        </button>
        <router-link to="/register" v-else class="action-btn">
          <span class="icon">👤</span>
          <span>注册账号</span>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth'
import { useComposerStore } from '@/stores/composer'

const authStore = useAuthStore()
const composerStore = useComposerStore()

function handleStartDiscussion() {
  if (!authStore.canStartDiscussion) return
  composerStore.openDiscussionComposer({
    source: 'home'
  })
}
</script>

<style scoped>
.home {
  min-height: calc(100vh - 200px);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--forum-bg-canvas);
}

.flarum-container {
  text-align: center;
  max-width: 600px;
  padding: var(--forum-space-8);
}

.welcome-banner {
  margin-bottom: 40px;
}

.welcome-banner h1 {
  font-size: 48px;
  color: var(--forum-text-color);
  margin-bottom: 10px;
  font-weight: 300;
}

.welcome-banner p {
  font-size: 18px;
  color: var(--forum-text-muted);
}

.quick-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  flex-wrap: wrap;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 15px 30px;
  background: var(--forum-bg-elevated);
  border: 1px solid var(--forum-border-color);
  border-radius: var(--forum-radius-md);
  color: var(--forum-text-color);
  font-size: 16px;
  transition: all 0.2s;
  text-decoration: none;
  box-shadow: var(--forum-shadow-sm);
}

.action-btn:hover {
  border-color: var(--forum-border-strong);
  box-shadow: var(--forum-shadow-md);
  text-decoration: none;
}

.action-btn.primary {
  background: #4d698e;
  color: var(--forum-text-inverse);
  border-color: #4d698e;
}

.action-btn.primary:hover {
  background: var(--forum-primary-strong);
  border-color: var(--forum-primary-strong);
}

.icon {
  font-size: 20px;
}
</style>
