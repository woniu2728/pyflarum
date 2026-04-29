<template>
  <div ref="rootEl" class="discussion-mobile-nav discussion-actions-scope" :class="{ 'is-open': showDiscussionMenu }">
    <div v-if="showDiscussionMenu" class="discussion-actions-menu discussion-actions-menu--mobile">
      <button
        v-if="canReplyFromMenu"
        type="button"
        @click="$emit('menu-action', 'reply')"
      >
        {{ hasActiveComposer ? '继续回复' : '回复讨论' }}
      </button>
      <button
        v-else
        type="button"
        @click="$emit('menu-action', 'login')"
      >
        登录后回复
      </button>
      <button
        v-if="authStore.isAuthenticated && !isSuspended"
        type="button"
        @click="$emit('menu-action', 'toggle-subscription')"
      >
        {{ togglingSubscription ? '提交中...' : (discussion.is_subscribed ? '取消关注' : '关注讨论') }}
      </button>
      <button v-if="canEditDiscussion" type="button" @click="$emit('menu-action', 'edit')">
        编辑讨论
      </button>
      <button v-if="canModerateDiscussionSettings" type="button" @click="$emit('menu-action', 'toggle-pin')">
        {{ discussion.is_sticky ? '取消置顶' : '置顶讨论' }}
      </button>
      <button v-if="canModerateDiscussionSettings" type="button" @click="$emit('menu-action', 'toggle-lock')">
        {{ discussion.is_locked ? '解除锁定' : '锁定讨论' }}
      </button>
      <button v-if="canModerateDiscussionSettings" type="button" @click="$emit('menu-action', 'toggle-hide')">
        {{ discussion.is_hidden ? '恢复显示' : '隐藏讨论' }}
      </button>
      <button v-if="canModerateDiscussionSettings" type="button" class="is-danger" @click="$emit('menu-action', 'delete')">
        删除讨论
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
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
  }
})

defineEmits(['menu-action'])

const rootEl = ref(null)

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

.discussion-actions-menu {
  padding: 8px;
  border: 1px solid var(--forum-border-color);
  border-radius: var(--forum-radius-md);
  background: var(--forum-bg-elevated);
  box-shadow: var(--forum-shadow-md);
  z-index: 5;
}

.discussion-actions-menu button {
  width: 100%;
  margin: 0;
  border: 0;
  background: transparent;
  color: var(--forum-text-muted);
  padding: 9px 10px;
  border-radius: var(--forum-radius-sm);
  text-align: left;
  font-size: var(--forum-font-size-sm);
  cursor: pointer;
}

.discussion-actions-menu button:hover {
  background: var(--forum-bg-subtle);
}

.discussion-actions-menu button.is-danger {
  color: var(--forum-danger-color);
}

.discussion-actions-menu button.is-danger:hover {
  background: var(--forum-danger-soft);
}

@media (max-width: 768px) {
  .discussion-mobile-nav {
    display: block;
    margin: 0 15px;
  }

  .discussion-actions-menu--mobile {
    position: relative;
    left: auto;
    right: auto;
    top: auto;
    margin-top: 0;
  }
}
</style>
