<template>
  <div v-if="replyState?.kind === 'composer'" class="reply-placeholder">
    <button type="button" class="primary" @click="$emit('open-composer')">
      {{ replyState.actionLabel }}
    </button>
    <span v-if="replyState.hint">{{ replyState.hint }}</span>
  </div>
  <div
    v-else-if="replyState?.kind === 'login'"
    class="reply-notice"
    :class="`reply-notice--${replyState.tone || 'warning'}`"
  >
    <router-link :to="replyState.to || '/login'">{{ replyState.linkLabel || '登录' }}</router-link>
    {{ replyState.message }}
  </div>
  <div
    v-else-if="replyState"
    class="reply-notice"
    :class="`reply-notice--${replyState.tone || 'warning'}`"
  >
    {{ replyState.message }}
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { getDiscussionReplyState } from '@/forum/registry'

const props = defineProps({
  authStore: {
    type: Object,
    required: true
  },
  discussion: {
    type: Object,
    required: true
  },
  isSuspended: {
    type: Boolean,
    default: false
  },
  suspensionNotice: {
    type: String,
    default: ''
  },
  hasActiveComposer: {
    type: Boolean,
    default: false
  }
})

defineEmits(['open-composer'])

const replyState = computed(() => getDiscussionReplyState({
  authStore: props.authStore,
  discussion: props.discussion,
  isSuspended: props.isSuspended,
  suspensionNotice: props.suspensionNotice,
  hasActiveComposer: props.hasActiveComposer,
  surface: 'discussion-reply',
}))
</script>

<style scoped>
.reply-placeholder {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 20px;
  background: var(--forum-bg-elevated-strong);
  border: 1px dashed var(--forum-border-strong);
  border-radius: var(--forum-radius-md);
  margin-bottom: 20px;
  color: var(--forum-text-soft);
  font-size: var(--forum-font-size-sm);
}

.reply-notice {
  text-align: center;
  padding: 20px;
  border-radius: var(--forum-radius-sm);
  line-height: 1.6;
}

.reply-notice--warning {
  background: var(--forum-warning-bg-strong);
  color: var(--forum-warning-color);
}

@media (max-width: 768px) {
  .reply-placeholder,
  .reply-notice {
    margin-left: 15px;
    margin-right: 15px;
  }

  .reply-placeholder {
    flex-direction: column;
    align-items: flex-start;
    padding: 14px 15px;
    gap: 8px;
  }

  .reply-notice {
    padding: 14px 15px;
    font-size: 13px;
  }
}
</style>
