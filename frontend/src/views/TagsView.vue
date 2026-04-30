<template>
  <div class="tags-page">
    <ForumPageWithSidebar>
      <template #sidebar>
        <ForumStartDiscussionButton
          v-if="!authStore.isAuthenticated || authStore.canStartDiscussion"
          @click="handleStartDiscussion"
        />

        <nav class="side-nav">
          <router-link to="/" class="nav-item">
            <i class="far fa-comments"></i>
            全部讨论
          </router-link>
          <router-link v-if="authStore.user" to="/following" class="nav-item">
            <i class="fas fa-bell"></i>
            关注中
          </router-link>
          <router-link to="/tags" class="nav-item active">
            <i class="fas fa-tags"></i>
            全部标签
          </router-link>
          <router-link v-if="authStore.user" :to="`/u/${authStore.user.id}`" class="nav-item">
            <i class="fas fa-user"></i>
            我的主页
          </router-link>
        </nav>
      </template>

      <main class="tags-content">
        <ForumHeroPanel title="全部标签" variant="default" />

        <ForumStateBlock v-if="loading">加载中...</ForumStateBlock>
        <ForumStateBlock v-else-if="tags.length === 0">暂无标签</ForumStateBlock>

        <template v-else>
          <div class="tag-grid">
            <ForumTagTile
              v-for="tag in tags"
              :key="tag.id"
              :tag="tag"
            />
          </div>

          <ForumTagCloud v-if="cloudTags.length" :tags="cloudTags" />
        </template>
      </main>
    </ForumPageWithSidebar>
  </div>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth'
import { useComposerStore } from '@/stores/composer'
import { useRouter } from 'vue-router'
import ForumHeroPanel from '@/components/forum/ForumHeroPanel.vue'
import ForumPageWithSidebar from '@/components/forum/ForumPageWithSidebar.vue'
import ForumStartDiscussionButton from '@/components/forum/ForumStartDiscussionButton.vue'
import ForumStateBlock from '@/components/forum/ForumStateBlock.vue'
import ForumTagCloud from '@/components/forum/ForumTagCloud.vue'
import ForumTagTile from '@/components/forum/ForumTagTile.vue'
import { useTagsPage } from '@/composables/useTagsPage'

const authStore = useAuthStore()
const composerStore = useComposerStore()
const router = useRouter()

const { cloudTags, loading, tags } = useTagsPage()

function handleStartDiscussion() {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }
  if (!authStore.canStartDiscussion) return

  composerStore.openDiscussionComposer({
    source: 'tags'
  })
}
</script>

<style scoped>
.tags-page {
  background: var(--forum-bg-canvas);
  min-height: calc(100vh - 56px);
}

.side-nav {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: var(--forum-radius-sm);
  color: var(--forum-text-muted);
}

.nav-item:hover,
.nav-item.active {
  background: var(--forum-primary-color);
  color: var(--forum-text-inverse);
  text-decoration: none;
}

.tags-content {
  padding: 24px 28px 40px;
}

.tag-grid {
  display: grid;
  gap: 18px;
}
</style>
