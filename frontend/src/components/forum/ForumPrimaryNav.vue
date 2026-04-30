<template>
  <nav class="forum-primary-nav">
    <router-link to="/" class="forum-primary-nav__item" :class="{ active: activeKey === 'home' }">
      <i class="far fa-comments"></i>
      全部讨论
    </router-link>
    <router-link
      v-if="authStore.user"
      to="/following"
      class="forum-primary-nav__item"
      :class="{ active: activeKey === 'following' }"
    >
      <i class="fas fa-bell"></i>
      关注中
    </router-link>
    <router-link to="/tags" class="forum-primary-nav__item" :class="{ active: activeKey === 'tags' }">
      <i class="fas fa-tags"></i>
      全部标签
    </router-link>
    <router-link
      v-if="showNotifications"
      to="/notifications"
      class="forum-primary-nav__item"
      :class="{ active: activeKey === 'notifications' }"
    >
      <i class="fas fa-inbox"></i>
      通知
    </router-link>
    <router-link
      v-if="authStore.user"
      :to="buildUserPath(authStore.user)"
      class="forum-primary-nav__item"
      :class="{ active: activeKey === 'profile' }"
    >
      <i class="fas fa-user"></i>
      我的主页
    </router-link>
  </nav>
</template>

<script setup>
import { buildUserPath } from '@/utils/forum'

defineProps({
  activeKey: {
    type: String,
    default: 'home'
  },
  authStore: {
    type: Object,
    required: true
  },
  showNotifications: {
    type: Boolean,
    default: true
  }
})
</script>

<style scoped>
.forum-primary-nav {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.forum-primary-nav__item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: var(--forum-radius-sm);
  color: var(--forum-text-muted);
}

.forum-primary-nav__item:hover,
.forum-primary-nav__item.active {
  background: var(--forum-primary-color);
  color: var(--forum-text-inverse);
  text-decoration: none;
}
</style>
