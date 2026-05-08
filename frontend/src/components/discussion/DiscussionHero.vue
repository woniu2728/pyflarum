<template>
  <div class="discussion-header" :style="discussionHeaderStyle">
    <div v-if="discussionBadges.length" class="discussion-badges">
      <span
        v-for="badge in discussionBadges"
        :key="badge.key"
        class="badge"
        :class="badge.className"
        :title="badge.title || ''"
      >
        <i v-if="badge.icon" :class="badge.icon"></i>
        <span v-if="badge.label">{{ badge.label }}</span>
      </span>
    </div>
    <h1>{{ discussion.title }}</h1>
    <div v-if="discussion.tags && discussion.tags.length" class="discussion-tags">
      <ForumTagBadge
        v-for="tag in discussion.tags"
        :key="tag.id"
        :tag="tag"
        :to="buildTagPath(tag)"
        max-width="220px"
      />
    </div>
    <div
      v-if="discussionReviewBanner"
      class="discussion-review-banner"
      :class="{ 'discussion-review-banner--rejected': discussionReviewBanner.tone === 'danger' }"
    >
      <strong>{{ discussionReviewBanner.title }}</strong>
      <p>
        {{ discussionReviewBanner.message }}
      </p>
      <div v-if="discussionReviewBanner.actions?.length" class="review-action-row">
        <button
          v-for="actionItem in discussionReviewBanner.actions"
          :key="actionItem.key"
          type="button"
          class="review-action"
          :class="actionItem.tone === 'reject' ? 'review-action--reject' : 'review-action--approve'"
          @click="handleReviewAction(actionItem.action)"
        >
          {{ actionItem.label }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import ForumTagBadge from '@/components/forum/ForumTagBadge.vue'
import { getDiscussionReviewBanner } from '@/forum/registry'

const props = defineProps({
  discussion: {
    type: Object,
    required: true
  },
  discussionHeaderStyle: {
    type: Object,
    default: () => ({})
  },
  canModeratePendingDiscussion: {
    type: Boolean,
    default: false
  },
  canEditDiscussion: {
    type: Boolean,
    default: false
  },
  buildTagPath: {
    type: Function,
    required: true
  },
  discussionBadges: {
    type: Array,
    default: () => []
  }
})

const discussionReviewBanner = computed(() => getDiscussionReviewBanner({
  discussion: props.discussion,
  canModeratePendingDiscussion: props.canModeratePendingDiscussion,
  canEditDiscussion: props.canEditDiscussion,
  surface: 'discussion-hero',
}))

const emit = defineEmits(['moderate-discussion', 'edit-discussion'])

function handleReviewAction(action) {
  if (action === 'edit') {
    emit('edit-discussion')
    return
  }

  emit('moderate-discussion', action)
}
</script>

<style scoped>
.discussion-header {
  margin-bottom: var(--forum-space-7);
  padding-bottom: var(--forum-space-5);
  border-bottom: 2px solid var(--forum-border-soft);
}

.discussion-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 15px;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: var(--forum-space-1) var(--forum-space-3);
  border-radius: var(--forum-radius-sm);
  font-size: var(--forum-font-size-xs);
  font-weight: 600;
}

.badge-pinned {
  background: var(--forum-warning-color);
  color: var(--forum-text-inverse);
}

.badge-locked {
  background: var(--forum-text-soft);
  color: var(--forum-text-inverse);
}

.badge-hidden {
  background: var(--forum-danger-color);
  color: var(--forum-text-inverse);
}

.badge-pending {
  background: var(--forum-warning-bg-strong);
  color: var(--forum-warning-color);
}

.discussion-header h1 {
  font-size: var(--forum-font-size-3xl);
  color: var(--forum-text-color);
  margin-bottom: 15px;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.discussion-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.discussion-review-banner {
  margin-top: 16px;
  padding: 14px 16px;
  border: 1px solid var(--forum-warning-border-strong);
  border-radius: var(--forum-radius-md);
  background: var(--forum-warning-bg);
  color: var(--forum-warning-color);
}

.discussion-review-banner strong {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
}

.discussion-review-banner p {
  margin: 0;
  line-height: 1.7;
  font-size: 13px;
}

.review-action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 12px;
}

.review-action {
  border: 0;
  border-radius: var(--forum-radius-pill);
  min-height: 34px;
  padding: 0 14px;
  font-size: var(--forum-font-size-sm);
  font-weight: 700;
  cursor: pointer;
}

.review-action--approve {
  background: var(--forum-success-color);
  color: var(--forum-text-inverse);
}

.review-action--reject {
  background: var(--forum-bg-elevated);
  color: var(--forum-danger-color);
  box-shadow: inset 0 0 0 1px rgba(154, 75, 75, 0.22);
}

.discussion-review-banner--rejected {
  border-color: var(--forum-danger-border);
  background: var(--forum-danger-bg);
  color: var(--forum-danger-color);
}

@media (max-width: 768px) {
  .discussion-header {
    margin: 0 0 14px;
    padding: 18px 18px 22px;
    border-bottom: 0;
    background: linear-gradient(180deg, var(--discussion-hero-color) 0%, var(--discussion-hero-color-dark) 100%);
    text-align: center;
  }

  .discussion-badges,
  .discussion-tags {
    flex-wrap: wrap;
    justify-content: center;
  }

  .discussion-badges {
    margin-bottom: 12px;
  }

  .discussion-header h1 {
    font-size: 24px;
    line-height: 1.24;
    margin-bottom: 10px;
    color: var(--discussion-hero-contrast);
  }

  .tag {
    max-width: min(78vw, 260px);
    padding: 5px 12px;
    font-size: 12px;
    background: rgba(255, 255, 255, 0.96) !important;
    color: var(--discussion-hero-color-dark);
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.18);
  }

  .discussion-badges .badge {
    background: rgba(255, 255, 255, 0.22);
    color: var(--discussion-hero-contrast);
    border: 1px solid rgba(255, 255, 255, 0.24);
  }
}
</style>
