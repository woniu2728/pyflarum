<template>
  <div v-if="authStore.isAuthenticated && isSuspended" class="suspended-notice">
    {{ suspensionNotice }}
  </div>
  <div v-else-if="authStore.isAuthenticated && discussion.can_reply" class="reply-placeholder">
    <button type="button" class="primary" @click="$emit('open-composer')">
      {{ hasActiveComposer ? '继续编辑回复' : '发表回复' }}
    </button>
    <span v-if="hasActiveComposer">已有未发布内容</span>
  </div>
  <div v-else-if="discussion.is_locked" class="locked-notice">
    此讨论已被锁定，无法回复
  </div>
  <div v-else-if="discussion.approval_status === 'pending'" class="locked-notice">
    讨论正在审核中，暂时无法继续回复
  </div>
  <div v-else-if="discussion.approval_status === 'rejected'" class="locked-notice">
    讨论未通过审核，需调整后重新发布
  </div>
  <div v-else-if="authStore.isAuthenticated" class="locked-notice">
    当前没有在此讨论下回复的权限
  </div>
  <div v-else class="login-notice">
    <router-link to="/login">登录</router-link> 后才能回复
  </div>
</template>

<script setup>
defineProps({
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

.suspended-notice {
  padding: 18px 20px;
  background: var(--forum-warning-bg-strong);
  border: 1px solid #ffe69c;
  border-radius: var(--forum-radius-md);
  margin-bottom: 20px;
  color: var(--forum-warning-color);
  line-height: 1.6;
}

.locked-notice,
.login-notice {
  text-align: center;
  padding: 20px;
  background: var(--forum-warning-bg-strong);
  border-radius: var(--forum-radius-sm);
  color: var(--forum-warning-color);
}

@media (max-width: 768px) {
  .reply-placeholder,
  .locked-notice,
  .login-notice,
  .suspended-notice {
    margin-left: 15px;
    margin-right: 15px;
  }

  .reply-placeholder {
    flex-direction: column;
    align-items: flex-start;
    padding: 14px 15px;
    gap: 8px;
  }

  .locked-notice,
  .login-notice,
  .suspended-notice {
    padding: 14px 15px;
    font-size: 13px;
  }
}
</style>
