<template>
  <aside class="sidebar">
    <div
      class="sidebar-section sidebar-section--actions discussion-actions-scope"
    >
      <button
        v-if="authStore.isAuthenticated"
        type="button"
        class="discussion-primary-action"
        :disabled="discussion.is_locked || isSuspended"
        @click="$emit('primary-action')"
      >
        <i class="fas fa-reply"></i>
        {{ hasActiveComposer ? '继续回复' : '回复' }}
      </button>
      <button
        v-else
        type="button"
        class="discussion-primary-action"
        @click="$emit('login-action')"
      >
        <i class="fas fa-sign-in-alt"></i>
        登录后回复
      </button>

      <div v-if="authStore.isAuthenticated && !isSuspended" class="discussion-secondary-row">
        <button
          type="button"
          class="discussion-follow-action"
          :class="{
            'is-active': discussion.is_subscribed,
            'is-standalone': !canShowDiscussionMenu
          }"
          :disabled="togglingSubscription"
          @click="$emit('toggle-subscription')"
        >
          <i :class="discussion.is_subscribed ? 'fas fa-bell-slash' : 'far fa-star'"></i>
          {{ togglingSubscription ? '提交中...' : (discussion.is_subscribed ? '取消关注' : '关注') }}
        </button>
        <button
          v-if="canShowDiscussionMenu"
          type="button"
          class="discussion-menu-toggle"
          :class="{ 'is-active': showDiscussionMenu }"
          @click="$emit('toggle-menu')"
        >
          <i class="fas fa-chevron-down"></i>
        </button>
      </div>

      <div
        v-if="showDiscussionMenu && canShowDiscussionMenu"
        class="discussion-actions-menu"
      >
        <button v-if="canEditDiscussion" type="button" @click="emitMenuAction('edit')">
          编辑讨论
        </button>
        <button v-if="canModerateDiscussionSettings" type="button" @click="emitMenuAction('toggle-pin')">
          {{ discussion.is_sticky ? '取消置顶' : '置顶讨论' }}
        </button>
        <button v-if="canModerateDiscussionSettings" type="button" @click="emitMenuAction('toggle-lock')">
          {{ discussion.is_locked ? '解除锁定' : '锁定讨论' }}
        </button>
        <button v-if="canModerateDiscussionSettings" type="button" @click="emitMenuAction('toggle-hide')">
          {{ discussion.is_hidden ? '恢复显示' : '隐藏讨论' }}
        </button>
        <button v-if="canModerateDiscussionSettings" type="button" class="is-danger" @click="emitMenuAction('delete')">
          删除讨论
        </button>
      </div>

      <p v-if="authStore.isAuthenticated && hasActiveComposer" class="discussion-action-copy">
        当前讨论已有未发布回复草稿。
      </p>
      <p v-else-if="authStore.isAuthenticated && discussion.is_subscribed" class="discussion-action-copy">
        你会收到这条讨论后续回复的通知。
      </p>
      <p v-else-if="authStore.isAuthenticated && discussion.is_locked" class="discussion-action-copy">
        当前讨论已锁定，暂时无法继续回复。
      </p>
      <p v-else-if="authStore.isAuthenticated && isSuspended" class="discussion-action-copy discussion-action-copy--warning">
        {{ suspensionNotice }}
      </p>
    </div>

    <div v-if="authStore.isAuthenticated && isSuspended" class="sidebar-section sidebar-section--warning">
      <h3>账号状态</h3>
      <p class="subscription-copy">{{ suspensionNotice }}</p>
    </div>

    <div class="sidebar-section sidebar-section--scrubber">
      <div ref="scrubberPanel" class="scrubber-panel">
        <button type="button" class="scrubber-link" @click="$emit('jump-to-post', 1)">
          <i class="fas fa-angle-double-up"></i>
          原帖
        </button>

        <div
          ref="scrubberTrack"
          class="scrubber-scrollbar"
          :style="scrubberScrollbarStyle"
          @click="$emit('scrubber-track-click', $event)"
        >
          <div class="scrubber-before" :style="{ height: `${scrubberBeforePercent}%` }"></div>
          <div
            v-if="unreadCount"
            class="scrubber-unread"
            :style="{
              top: `${unreadTopPercent}%`,
              height: `${unreadHeightPercent}%`
            }"
          ></div>
          <div
            class="scrubber-handle"
            :style="{
              top: `${scrubberBeforePercent}%`,
              height: `${scrubberHandlePercent}%`
            }"
            :class="{ 'is-dragging': scrubberDragging }"
            @mousedown="$emit('scrubber-handle-pointerdown', $event)"
            @touchstart="$emit('scrubber-handle-pointerdown', $event)"
            @click.stop
          >
            <div class="scrubber-bar"></div>
            <div class="scrubber-info">
              <strong>{{ scrubberPositionText }}</strong>
              <span class="scrubber-description">{{ scrubberDescription }}</span>
            </div>
          </div>
          <div class="scrubber-after" :style="{ height: `${scrubberAfterPercent}%` }"></div>
        </div>

        <button type="button" class="scrubber-link" @click="$emit('jump-to-post', maxPostNumber)">
          <i class="fas fa-angle-double-down"></i>
          现在
        </button>
      </div>
    </div>
  </aside>
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
  suspensionNotice: {
    type: String,
    default: ''
  },
  hasActiveComposer: {
    type: Boolean,
    default: false
  },
  canShowDiscussionMenu: {
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
  showDiscussionMenu: {
    type: Boolean,
    default: false
  },
  togglingSubscription: {
    type: Boolean,
    default: false
  },
  scrubberScrollbarStyle: {
    type: Object,
    default: () => ({})
  },
  scrubberBeforePercent: {
    type: Number,
    default: 0
  },
  scrubberAfterPercent: {
    type: Number,
    default: 0
  },
  scrubberHandlePercent: {
    type: Number,
    default: 100
  },
  scrubberDragging: {
    type: Boolean,
    default: false
  },
  unreadCount: {
    type: Number,
    default: 0
  },
  unreadTopPercent: {
    type: Number,
    default: 0
  },
  unreadHeightPercent: {
    type: Number,
    default: 0
  },
  scrubberPositionText: {
    type: String,
    default: ''
  },
  scrubberDescription: {
    type: String,
    default: ''
  },
  maxPostNumber: {
    type: Number,
    default: 1
  }
})

const emit = defineEmits([
  'primary-action',
  'login-action',
  'toggle-subscription',
  'toggle-menu',
  'menu-action',
  'jump-to-post',
  'scrubber-track-click',
  'scrubber-handle-pointerdown'
])

const scrubberPanel = ref(null)
const scrubberTrack = ref(null)

function emitMenuAction(action) {
  emit('menu-action', action)
}

function getScrubberPanelEl() {
  return scrubberPanel.value
}

function getScrubberTrackEl() {
  return scrubberTrack.value
}

defineExpose({
  getScrubberPanelEl,
  getScrubberTrackEl
})
</script>

<style scoped>
.sidebar {
  height: fit-content;
  position: sticky;
  top: 20px;
}

.sidebar-section {
  background: var(--forum-bg-elevated);
  padding: 20px;
  border-radius: var(--forum-radius-md);
  margin-bottom: 20px;
  box-shadow: var(--forum-shadow-sm);
}

.sidebar-section h3 {
  font-size: 16px;
  margin-bottom: 15px;
  color: var(--forum-text-color);
}

.sidebar-section--warning {
  background: var(--forum-accent-surface);
  border: 1px solid #fde7b2;
}

.sidebar-section--actions {
  position: relative;
  padding: 16px;
}

.discussion-primary-action {
  width: 100%;
  border: 0;
  border-radius: var(--forum-radius-md);
  padding: 12px 16px;
  background: var(--forum-accent-color);
  color: var(--forum-text-inverse);
  font-size: 15px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  cursor: pointer;
}

.discussion-primary-action:hover {
  filter: brightness(0.96);
}

.discussion-primary-action:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.discussion-secondary-row {
  display: flex;
  margin-top: 12px;
}

.discussion-follow-action,
.discussion-menu-toggle {
  border: 0;
  background: var(--forum-bg-subtle);
  color: var(--forum-text-muted);
  cursor: pointer;
  height: 44px;
}

.discussion-follow-action {
  flex: 1;
  border-radius: var(--forum-radius-md) 0 0 var(--forum-radius-md);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
}

.discussion-follow-action.is-standalone {
  border-radius: var(--forum-radius-md);
}

.discussion-follow-action.is-active {
  color: var(--forum-text-color);
}

.discussion-menu-toggle {
  width: 48px;
  border-left: 1px solid var(--forum-border-color);
  border-radius: 0 var(--forum-radius-md) var(--forum-radius-md) 0;
}

.discussion-follow-action:hover,
.discussion-menu-toggle:hover,
.discussion-menu-toggle.is-active {
  background: #e3ebf4;
}

.discussion-follow-action:disabled,
.discussion-menu-toggle:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.discussion-actions-menu {
  position: absolute;
  left: 16px;
  right: 16px;
  top: 72px;
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

.discussion-action-copy {
  margin: 12px 0 0;
  color: var(--forum-text-soft);
  font-size: var(--forum-font-size-sm);
  line-height: 1.6;
}

.discussion-action-copy--warning {
  color: var(--forum-warning-color);
}

.subscription-copy {
  color: var(--forum-text-muted);
  line-height: 1.6;
  margin-bottom: 14px;
}

.sidebar-section > button {
  margin-bottom: 10px;
}

.sidebar-section > button:last-child {
  margin-bottom: 0;
}

.sidebar-section--scrubber {
  padding: 18px 18px 14px;
}

.scrubber-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.scrubber-link {
  border: 0;
  background: transparent;
  color: var(--forum-text-muted);
  padding: 0;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  width: fit-content;
  cursor: pointer;
}

.scrubber-link:hover {
  color: var(--forum-text-color);
}

.scrubber-scrollbar {
  margin: 8px 0 8px 3px;
  height: 300px;
  min-height: 50px;
  position: relative;
  cursor: pointer;
  user-select: none;
}

.scrubber-before,
.scrubber-after {
  position: absolute;
  left: 0;
  width: 100%;
  border-left: 1px solid var(--forum-border-color);
}

.scrubber-before {
  top: 0;
}

.scrubber-after {
  bottom: 0;
}

.scrubber-unread {
  position: absolute;
  left: 0;
  width: 100%;
  border-left: 1px solid var(--forum-border-strong);
  background-image: linear-gradient(to right, rgba(230, 235, 241, 0.92), transparent 10px, transparent);
  display: flex;
  align-items: center;
  color: var(--forum-text-soft);
  text-transform: uppercase;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.02em;
  padding-left: 13px;
  pointer-events: none;
}

.scrubber-handle {
  position: absolute;
  left: 0;
  width: 100%;
  padding: 5px 0;
  cursor: move;
  z-index: 1;
}

.scrubber-bar {
  height: 100%;
  width: 5px;
  background: var(--forum-primary-color);
  border-radius: 4px;
  margin-left: -2px;
  transition: background 0.2s;
}

.scrubber-info {
  position: absolute;
  top: 50%;
  left: 15px;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
  width: max-content;
  max-width: calc(100% - 15px);
  pointer-events: none;
}

.scrubber-info strong {
  color: var(--forum-text-color);
  font-size: var(--forum-font-size-sm);
  line-height: 1;
  white-space: nowrap;
}

.scrubber-description {
  color: var(--forum-text-soft);
  font-size: var(--forum-font-size-xs);
  line-height: 1;
  white-space: nowrap;
}

.scrubber-handle.is-dragging .scrubber-bar,
:global(body.scrubber-dragging) .scrubber-bar {
  background: var(--forum-accent-color);
}

:global(body.scrubber-dragging) {
  cursor: move;
}
</style>
