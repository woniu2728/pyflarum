<template>
  <section v-if="isFollowingPage" class="tag-hero following-hero">
    <div class="tag-hero-inner">
      <div class="tag-hero-pill following-pill">
        <i class="fas fa-bell"></i>
        关注中
      </div>
      <h1>关注的讨论</h1>
      <p>这里会显示你已关注、并在后续收到新回复通知的讨论。</p>
    </div>
  </section>

  <section v-if="currentTag" class="tag-hero" :style="{ '--tag-color': currentTag.color }">
    <div class="tag-hero-inner">
      <div class="tag-hero-pill">
        <span class="tag-bullet" :style="{ backgroundColor: currentTag.color }"></span>
        {{ currentTag.name }}
      </div>
      <h1>{{ currentTag.name }}</h1>
      <p>{{ currentTag.description || '这个标签下的讨论会集中显示在这里。' }}</p>
    </div>
  </section>

  <div class="index-toolbar">
    <ul class="index-toolbar-view">
      <li>
        <button class="btn-view" :class="{ active: sortBy === 'latest' }" @click="$emit('change-sort', 'latest')">
          最新活跃
        </button>
      </li>
      <li>
        <button class="btn-view" :class="{ active: sortBy === 'newest' }" @click="$emit('change-sort', 'newest')">
          新主题
        </button>
      </li>
      <li>
        <button class="btn-view" :class="{ active: sortBy === 'top' }" @click="$emit('change-sort', 'top')">
          热门
        </button>
      </li>
    </ul>

    <ul class="index-toolbar-action">
      <li v-if="authStore.isAuthenticated">
        <button
          class="btn-mark-read"
          :disabled="markingAllRead"
          title="全部标记为已读"
          @click="$emit('mark-all-read')"
        >
          <i class="fas fa-check-double"></i>
        </button>
      </li>
      <li>
        <button class="btn-refresh" title="刷新" @click="$emit('refresh')">
          <i class="fas fa-sync-alt"></i>
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup>
defineProps({
  authStore: {
    type: Object,
    required: true
  },
  currentTag: {
    type: Object,
    default: null
  },
  isFollowingPage: {
    type: Boolean,
    default: false
  },
  sortBy: {
    type: String,
    default: 'latest'
  },
  markingAllRead: {
    type: Boolean,
    default: false
  }
})

defineEmits(['change-sort', 'mark-all-read', 'refresh'])
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

.index-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 26px;
  border-bottom: 1px solid var(--forum-border-color);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(250, 252, 253, 0.92) 100%);
}

.index-toolbar-view,
.index-toolbar-action {
  display: flex;
  gap: 5px;
  list-style: none;
  padding: 0;
  margin: 0;
}

.btn-view {
  background: var(--forum-bg-subtle);
  border: none;
  color: var(--forum-text-muted);
  font-size: 13px;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: var(--forum-radius-pill);
  transition: all 0.15s;
  font-weight: 500;
}

.btn-view:hover {
  background: #dbe5ed;
  color: var(--forum-text-color);
}

.btn-view.active {
  background: var(--forum-primary-color);
  color: var(--forum-text-inverse);
}

.btn-refresh,
.btn-mark-read {
  background: none;
  border: none;
  color: var(--forum-text-soft);
  font-size: 14px;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: var(--forum-radius-pill);
  transition: all 0.15s;
}

.btn-refresh:hover,
.btn-mark-read:hover {
  background: var(--forum-bg-subtle);
  color: var(--forum-text-color);
}

.btn-mark-read:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

  .index-toolbar {
    flex-wrap: wrap;
    gap: 10px;
    padding: 12px 15px;
  }

  .index-toolbar-view,
  .index-toolbar-action {
    flex-wrap: wrap;
  }

  .btn-view,
  .btn-refresh,
  .btn-mark-read {
    min-height: 34px;
    border-radius: 999px;
  }

  .btn-view {
    padding: 6px 11px;
    font-size: 12px;
  }
}
</style>
