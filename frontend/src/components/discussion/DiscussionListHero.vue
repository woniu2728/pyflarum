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
import { toRef } from 'vue'
import { useDiscussionListHeroState } from '@/composables/useDiscussionListHeroState'

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

const {
  currentTagDescriptionText,
  filterHeroDescriptionText,
  filterHeroIcon,
  filterHeroPillText,
  filterHeroTitleText,
  showFilterHero,
} = useDiscussionListHeroState({
  currentTag: toRef(props, 'currentTag'),
  isFollowingPage: toRef(props, 'isFollowingPage'),
  listFilter: toRef(props, 'listFilter'),
})
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
