<template>
  <section v-if="isFollowingPage" class="tag-hero following-hero">
    <div class="tag-hero-inner">
      <div class="tag-hero-pill following-pill">
        <i class="fas fa-bell"></i>
        {{ followingPillText }}
      </div>
      <h1>{{ followingTitleText }}</h1>
      <p>{{ followingDescriptionText }}</p>
    </div>
  </section>

  <section v-else-if="currentTag" class="tag-hero" :style="{ '--tag-color': currentTag.color }">
    <div class="tag-hero-inner">
      <div class="tag-hero-pill">
        <span class="tag-bullet" :style="{ backgroundColor: currentTag.color }"></span>
        {{ currentTag.name }}
      </div>
      <h1>{{ currentTag.name }}</h1>
      <p>{{ currentTag.description || currentTagDescriptionText }}</p>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { getUiCopy } from '@/forum/registry'

const props = defineProps({
  currentTag: {
    type: Object,
    default: null
  },
  isFollowingPage: {
    type: Boolean,
    default: false
  }
})

const followingPillText = computed(() => getUiCopy({
  surface: 'discussion-list-following-hero-pill',
})?.text || '关注中')

const followingTitleText = computed(() => getUiCopy({
  surface: 'discussion-list-following-hero-title',
})?.text || '关注的讨论')

const followingDescriptionText = computed(() => getUiCopy({
  surface: 'discussion-list-following-hero-description',
})?.text || '这里会显示你已关注、并在后续收到新回复通知的讨论。')

const currentTagDescriptionText = computed(() => getUiCopy({
  surface: 'discussion-list-tag-hero-description',
  tagName: props.currentTag?.name || '',
})?.text || '这个标签下的讨论会集中显示在这里。')
</script>

<style scoped>
.tag-bullet {
  width: 12px;
  height: 12px;
  display: inline-block;
  border-radius: 999px;
  flex-shrink: 0;
  background: var(--tag-color);
}

.tag-hero {
  background: linear-gradient(135deg, color-mix(in srgb, var(--tag-color) 20%, white), #f8fbfd);
  border-bottom: 1px solid var(--forum-border-color);
}

.following-hero {
  --tag-color: var(--forum-primary-color);
}

.tag-hero-inner {
  padding: 28px 26px;
}

.tag-hero-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.82);
  color: #44515e;
  margin-bottom: 12px;
}

.tag-hero h1 {
  font-size: 30px;
  font-weight: 300;
  color: #2f3c4d;
  margin-bottom: 8px;
}

.tag-hero p {
  color: #61707f;
}

@media (max-width: 768px) {
  .tag-hero-inner {
    padding: 18px 15px;
  }

  .tag-hero h1 {
    font-size: 24px;
    line-height: 1.2;
    margin-bottom: 6px;
  }

  .tag-hero p {
    font-size: 13px;
    line-height: 1.6;
  }
}
</style>
