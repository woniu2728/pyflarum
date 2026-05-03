<template>
  <article
    :id="`post-${post.number}`"
    class="event-post-item"
    :class="{ 'is-target': isTarget }"
  >
    <div class="event-post-card">
      <div class="event-post-icon" aria-hidden="true">
        <i class="fas fa-heading"></i>
      </div>
      <div class="event-post-content">
        <div class="event-post-line">
          <strong>{{ actorName }}</strong>
          <span>将讨论标题从</span>
          <span class="event-post-title event-post-title--old">“{{ oldTitle }}”</span>
          <span>改为</span>
          <span class="event-post-title">“{{ newTitle }}”</span>
        </div>
        <div class="event-post-meta">
          <button
            type="button"
            class="event-post-number"
            :title="`跳转到第 ${post.number} 楼`"
            @click="$emit('jump-to-post', post.number)"
          >
            #{{ post.number }}
          </button>
          <time :datetime="post.created_at" :title="formatAbsoluteDate(post.created_at)">
            {{ formatDate(post.created_at) }}
          </time>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  post: { type: Object, required: true },
  isTarget: { type: Boolean, default: false },
  getUserDisplayName: { type: Function, required: true },
  formatAbsoluteDate: { type: Function, required: true },
  formatDate: { type: Function, required: true }
})

defineEmits(['jump-to-post'])

const actorName = computed(() => props.getUserDisplayName(props.post.user))
const oldTitle = computed(() => props.post.event_data?.old_title || '旧标题')
const newTitle = computed(() => props.post.event_data?.new_title || '新标题')
</script>

<style scoped>
.event-post-item {
  padding: 18px 0;
}

.event-post-item.is-target .event-post-card {
  box-shadow: 0 0 0 2px rgba(231, 124, 47, 0.18);
}

.event-post-card {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-left: 72px;
  padding: 14px 16px;
  border-radius: 16px;
  background: linear-gradient(180deg, #fff8ef 0%, #fffdf8 100%);
  border: 1px solid rgba(214, 171, 120, 0.32);
}

.event-post-icon {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: rgba(199, 130, 53, 0.14);
  color: #9a5f1f;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
}

.event-post-content {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.event-post-line {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  color: var(--forum-text-muted);
  line-height: 1.7;
}

.event-post-line strong {
  color: var(--forum-text-color);
}

.event-post-title {
  color: #7a4a16;
  font-weight: 700;
}

.event-post-title--old {
  text-decoration: line-through;
  opacity: 0.72;
}

.event-post-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--forum-text-soft);
  font-size: var(--forum-font-size-sm);
}

.event-post-number {
  border: 0;
  background: transparent;
  color: inherit;
  padding: 0;
  cursor: pointer;
}

.event-post-number:hover {
  color: var(--forum-text-muted);
}

@media (max-width: 768px) {
  .event-post-card {
    margin-left: 0;
  }
}
</style>
