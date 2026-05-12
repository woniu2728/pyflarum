<template>
  <section v-if="showFilterHero" class="tag-hero following-hero">
    <div class="tag-hero-inner">
      <div class="tag-hero-pill following-pill">
        <i :class="filterHeroIcon"></i>
        {{ filterHeroPillText }}
      </div>
      <h1>{{ filterHeroTitleText }}</h1>
      <p>{{ filterHeroDescriptionText }}</p>
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
  },
  listFilter: {
    type: String,
    default: 'all'
  }
})

const activeFilterCode = computed(() => props.isFollowingPage ? 'following' : String(props.listFilter || 'all'))
const showFilterHero = computed(() => !props.currentTag && activeFilterCode.value !== 'all')

const filterHeroPillText = computed(() => getUiCopy({
  surface: 'discussion-list-filter-hero-pill',
  listFilter: activeFilterCode.value,
})?.text || resolveDiscussionListFilterLabel(activeFilterCode.value))

const filterHeroTitleText = computed(() => getUiCopy({
  surface: 'discussion-list-filter-hero-title',
  listFilter: activeFilterCode.value,
})?.text || resolveDiscussionListFilterHeroTitle(activeFilterCode.value))

const filterHeroDescriptionText = computed(() => getUiCopy({
  surface: 'discussion-list-filter-hero-description',
  listFilter: activeFilterCode.value,
})?.text || resolveDiscussionListFilterHeroDescription(activeFilterCode.value))

const filterHeroIcon = computed(() => {
  switch (activeFilterCode.value) {
    case 'unread':
      return 'fas fa-inbox'
    case 'my':
      return 'fas fa-user-pen'
    default:
      return 'fas fa-bell'
  }
})

const currentTagDescriptionText = computed(() => getUiCopy({
  surface: 'discussion-list-tag-hero-description',
  tagName: props.currentTag?.name || '',
})?.text || '这个标签下的讨论会集中显示在这里。')

function resolveDiscussionListFilterLabel(filterCode) {
  switch (String(filterCode || 'all').trim()) {
    case 'following':
      return '关注中'
    case 'unread':
      return '未读'
    case 'my':
      return '我的讨论'
    default:
      return '全部讨论'
  }
}

function resolveDiscussionListFilterHeroTitle(filterCode) {
  switch (String(filterCode || 'all').trim()) {
    case 'following':
      return '关注的讨论'
    case 'unread':
      return '未读讨论'
    case 'my':
      return '我的讨论'
    default:
      return '全部讨论'
  }
}

function resolveDiscussionListFilterHeroDescription(filterCode) {
  switch (String(filterCode || 'all').trim()) {
    case 'following':
      return '这里会显示你已关注、并在后续收到新回复通知的讨论。'
    case 'unread':
      return '这里会集中显示你仍有未读回复的讨论，方便继续跟进。'
    case 'my':
      return '这里会集中展示你发起过的讨论与最近互动。'
    default:
      return '浏览论坛最新讨论、热门主题和社区回复。'
  }
}
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
