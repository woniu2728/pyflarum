<template>
  <div ref="rootEl" class="discussion-mobile-nav discussion-actions-scope" :class="{ 'is-open': showDiscussionMenu }">
    <div class="discussion-mobile-bar">
      <button
        type="button"
        class="discussion-mobile-action discussion-mobile-action--reply"
        :disabled="replyAction.disabled"
        :title="replyAction.title"
        @click="handleReplyAction"
      >
        <i :class="replyAction.icon"></i>
        <span>{{ replyAction.label }}</span>
      </button>

      <button
        v-if="subscriptionAction"
        type="button"
        class="discussion-mobile-action"
        :class="{ 'is-active': discussion.is_subscribed }"
        :disabled="subscriptionAction.disabled"
        :title="subscriptionAction.title"
        @click="$emit('toggle-subscription')"
      >
        <i :class="subscriptionAction.icon"></i>
        <span>{{ subscriptionAction.label }}</span>
      </button>

      <button
        type="button"
        class="discussion-mobile-action"
        :title="shareTitle"
        @click="$emit('share-discussion')"
      >
        <i class="fas fa-arrow-up-from-bracket"></i>
        <span>{{ shareLabel }}</span>
      </button>

      <button
        v-if="menuItems.length"
        type="button"
        class="discussion-mobile-action"
        :class="{ 'is-active': showDiscussionMenu }"
        :title="moreTitle"
        @click="$emit('toggle-menu')"
      >
        <i class="fas fa-ellipsis"></i>
        <span>{{ moreLabel }}</span>
      </button>
    </div>

    <div v-if="showDiscussionMenu" class="discussion-actions-menu discussion-actions-menu--mobile">
      <ForumActionMenu
        :items="menuItems"
        container-class="discussion-actions-menu-list"
        item-class="discussion-actions-menu-item"
        @select="$emit('menu-action', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import ForumActionMenu from '@/components/forum/ForumActionMenu.vue'
import { getUiCopy } from '@/forum/registry'

const props = defineProps({
  discussion: {
    type: Object,
    required: true
  },
  authStore: {
    type: Object,
    required: true
  },
  isSuspended: {
    type: Boolean,
    default: false
  },
  showDiscussionMenu: {
    type: Boolean,
    default: false
  },
  canReplyFromMenu: {
    type: Boolean,
    default: false
  },
  hasActiveComposer: {
    type: Boolean,
    default: false
  },
  togglingSubscription: {
    type: Boolean,
    default: false
  },
  canEditDiscussion: {
    type: Boolean,
    default: false
  },
  canModerateDiscussionSettings: {
    type: Boolean,
    default: false
  },
  menuItems: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits([
  'menu-action',
  'open-composer',
  'open-login-for-reply',
  'share-discussion',
  'toggle-menu',
  'toggle-subscription'
])

const rootEl = ref(null)

const replyAction = computed(() => {
  if (props.authStore?.isAuthenticated && props.canReplyFromMenu) {
    return {
      icon: 'fas fa-reply',
      label: props.hasActiveComposer
        ? getUiCopy({ surface: 'discussion-mobile-action-continue-reply' })?.text || '继续回复'
        : getUiCopy({ surface: 'discussion-mobile-action-reply' })?.text || '回复',
      title: props.hasActiveComposer
        ? getUiCopy({ surface: 'discussion-mobile-action-continue-reply-description' })?.text || '继续当前未发布的回复草稿。'
        : getUiCopy({ surface: 'discussion-mobile-action-reply-description' })?.text || '在当前讨论中开始撰写回复。',
      disabled: false,
      action: 'reply'
    }
  }

  return {
    icon: 'fas fa-right-to-bracket',
    label: getUiCopy({ surface: 'discussion-mobile-action-login' })?.text || '登录后回复',
    title: getUiCopy({ surface: 'discussion-mobile-action-login-description' })?.text || '登录后才可以参与当前讨论。',
    disabled: false,
    action: 'login'
  }
})

const subscriptionAction = computed(() => {
  if (!props.authStore?.isAuthenticated || props.isSuspended) return null

  return {
    icon: props.discussion?.is_subscribed ? 'fas fa-bell-slash' : 'far fa-star',
    label: props.togglingSubscription
      ? getUiCopy({ surface: 'discussion-mobile-action-subscription-pending' })?.text || '提交中...'
      : props.discussion?.is_subscribed
        ? getUiCopy({ surface: 'discussion-mobile-action-unfollow' })?.text || '取消关注'
        : getUiCopy({ surface: 'discussion-mobile-action-follow' })?.text || '关注',
    title: props.discussion?.is_subscribed
      ? getUiCopy({ surface: 'discussion-mobile-action-unfollow-description' })?.text || '停止接收这条讨论的后续通知。'
      : getUiCopy({ surface: 'discussion-mobile-action-follow-description' })?.text || '接收这条讨论的后续回复通知。',
    disabled: props.togglingSubscription
  }
})

const shareLabel = computed(() => getUiCopy({
  surface: 'discussion-mobile-action-share',
})?.text || '分享')
const shareTitle = computed(() => getUiCopy({
  surface: 'discussion-mobile-action-share-description',
})?.text || '分享当前讨论链接。')
const moreLabel = computed(() => getUiCopy({
  surface: 'discussion-mobile-action-more',
})?.text || '更多')
const moreTitle = computed(() => getUiCopy({
  surface: 'discussion-mobile-action-more-description',
})?.text || '查看更多讨论操作。')

function handleReplyAction() {
  if (replyAction.value.action === 'reply') {
    emit('open-composer')
    return
  }

  emit('open-login-for-reply')
}

function getRootEl() {
  return rootEl.value
}

defineExpose({
  getRootEl
})
</script>

<style scoped>
.discussion-mobile-nav {
  display: none;
}

.discussion-mobile-bar {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  padding: 12px 15px;
  border-top: 1px solid var(--forum-border-color);
  border-bottom: 1px solid var(--forum-border-color);
  background:
    linear-gradient(180deg, rgba(244, 248, 252, 0.98), rgba(255, 255, 255, 0.98));
}

.discussion-mobile-action {
  min-height: 58px;
  padding: 8px 6px;
  border: 1px solid var(--forum-border-color);
  border-radius: var(--forum-radius-md);
  background: rgba(255, 255, 255, 0.92);
  color: var(--forum-text-muted);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
}

.discussion-mobile-action i {
  font-size: 15px;
}

.discussion-mobile-action--reply {
  background: var(--forum-accent-color);
  border-color: var(--forum-accent-color);
  color: var(--forum-text-inverse);
}

.discussion-mobile-action.is-active {
  color: var(--forum-text-color);
  border-color: rgba(77, 105, 142, 0.28);
  background: rgba(225, 234, 244, 0.9);
}

.discussion-mobile-action:disabled {
  opacity: 0.6;
}

.discussion-actions-menu {
  padding: 8px;
  border: 1px solid var(--forum-border-color);
  border-radius: var(--forum-radius-md);
  background: var(--forum-bg-elevated);
  box-shadow: var(--forum-shadow-md);
  z-index: 5;
}

.discussion-actions-menu-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

@media (max-width: 768px) {
  .discussion-mobile-nav {
    display: block;
    margin: 0;
  }

  .discussion-actions-menu--mobile {
    position: relative;
    left: auto;
    right: auto;
    top: auto;
    margin: 0 15px;
    border-top: 0;
    border-top-left-radius: 0;
    border-top-right-radius: 0;
    box-shadow: var(--forum-shadow-sm);
  }
}
</style>
