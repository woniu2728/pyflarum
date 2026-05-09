<template>
  <div class="discussion-create-redirect">
    <ForumStateBlock class="redirect-card">
      <div class="redirect-spinner"></div>
      <h1>{{ titleText }}</h1>
      <p>{{ descriptionText }}</p>
    </ForumStateBlock>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ForumStateBlock from '@/components/forum/ForumStateBlock.vue'
import { getUiCopy } from '@/forum/registry'
import { useAuthStore } from '@/stores/auth'
import { useComposerStore } from '@/stores/composer'
import { useStartDiscussionAction } from '@/composables/useStartDiscussionAction'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const composerStore = useComposerStore()
const { startDiscussion } = useStartDiscussionAction({
  authStore,
  composerStore,
  router
})
const titleText = computed(() => {
  return getUiCopy({
    surface: 'discussion-create-title',
  })?.text || '正在打开讨论编辑器...'
})
const descriptionText = computed(() => {
  return getUiCopy({
    surface: 'discussion-create-description',
  })?.text || '系统会自动切换到浮层编辑器。'
})

onMounted(() => {
  startDiscussion({
    redirectToLogin: true,
    source: 'route',
    tagId: typeof route.query.tag === 'string' ? route.query.tag : ''
  })
  router.replace(typeof route.query.returnTo === 'string' ? route.query.returnTo : '/')
})
</script>

<style scoped>
.discussion-create-redirect {
  min-height: calc(100vh - 200px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  background: var(--forum-bg-canvas);
}

.redirect-card {
  width: min(420px, 100%);
  text-align: center;
}

.redirect-card h1 {
  margin: 0 0 10px;
  font-size: 24px;
  font-weight: 400;
  color: var(--forum-text-color);
}

.redirect-card p {
  margin: 0;
  color: var(--forum-text-muted);
}

.redirect-spinner {
  width: 28px;
  height: 28px;
  margin: 0 auto 16px;
  border-radius: 50%;
  border: 3px solid var(--forum-border-color);
  border-top-color: var(--forum-primary-color);
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
