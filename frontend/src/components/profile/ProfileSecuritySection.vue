<template>
  <div class="profile-section security-section">
    <div class="profile-section-header">
      <div>
        <h2>账号安全</h2>
        <p>查看邮箱验证状态，并修改登录密码。</p>
      </div>
    </div>

    <div class="security-grid">
      <section class="profile-settings-card">
        <div class="profile-card-header">
          <div>
            <h3>邮箱验证</h3>
            <p>验证邮箱后，可确保找回密码和安全通知正常送达。</p>
          </div>
          <span
            class="email-status"
            :class="{ confirmed: user.is_email_confirmed, pending: !user.is_email_confirmed }"
          >
            {{ user.is_email_confirmed ? '已验证' : '未验证' }}
          </span>
        </div>

        <div class="email-summary">
          <strong>{{ user.email }}</strong>
          <p v-if="user.is_email_confirmed">当前邮箱已通过验证。</p>
          <p v-else>当前邮箱尚未验证，你可以重新发送验证邮件。</p>
        </div>

        <ForumInlineMessage v-if="verificationSuccess" tone="success">{{ verificationSuccess }}</ForumInlineMessage>
        <ForumInlineMessage v-if="verificationError" tone="danger">{{ verificationError }}</ForumInlineMessage>

        <button
          v-if="!user.is_email_confirmed"
          type="button"
          class="secondary"
          :disabled="verificationSending"
          @click="$emit('resend-verification')"
        >
          {{ verificationSending ? '发送中...' : '重新发送验证邮件' }}
        </button>
      </section>

      <section class="profile-settings-card">
        <div class="profile-card-header">
          <div>
            <h3>修改密码</h3>
            <p>修改后，下次登录请使用新密码。</p>
          </div>
        </div>

        <ForumInlineMessage v-if="passwordSuccess" tone="success">{{ passwordSuccess }}</ForumInlineMessage>
        <ForumInlineMessage v-if="passwordError" tone="danger">{{ passwordError }}</ForumInlineMessage>

        <div class="profile-form-group">
          <label for="profile-old-password">当前密码</label>
          <input
            id="profile-old-password"
            class="profile-form-control"
            :value="passwordForm.old_password"
            name="old_password"
            placeholder="请输入当前密码"
            type="password"
            @input="$emit('update-password-form', { key: 'old_password', value: $event.target.value })"
          />
        </div>

        <div class="profile-form-group">
          <label for="profile-new-password">新密码</label>
          <input
            id="profile-new-password"
            class="profile-form-control"
            :value="passwordForm.new_password"
            name="new_password"
            placeholder="请输入新密码"
            type="password"
            @input="$emit('update-password-form', { key: 'new_password', value: $event.target.value })"
          />
        </div>

        <div class="profile-form-group">
          <label for="profile-confirm-password">确认新密码</label>
          <input
            id="profile-confirm-password"
            class="profile-form-control"
            :value="passwordForm.confirm_password"
            name="confirm_password"
            placeholder="请再次输入新密码"
            type="password"
            @input="$emit('update-password-form', { key: 'confirm_password', value: $event.target.value })"
          />
        </div>

        <div class="profile-form-actions">
          <button type="button" class="primary" :disabled="changingPassword" @click="$emit('change-password')">
            {{ changingPassword ? '提交中...' : '更新密码' }}
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import ForumInlineMessage from '@/components/forum/ForumInlineMessage.vue'

defineProps({
  user: {
    type: Object,
    required: true
  },
  passwordForm: {
    type: Object,
    required: true
  },
  verificationSending: {
    type: Boolean,
    default: false
  },
  verificationSuccess: {
    type: String,
    default: ''
  },
  verificationError: {
    type: String,
    default: ''
  },
  changingPassword: {
    type: Boolean,
    default: false
  },
  passwordSuccess: {
    type: String,
    default: ''
  },
  passwordError: {
    type: String,
    default: ''
  }
})

defineEmits(['resend-verification', 'change-password', 'update-password-form'])
</script>

<style scoped>
.security-grid {
  display: grid;
  gap: 18px;
}

.email-summary p {
  color: #6b7a88;
  line-height: 1.6;
  overflow-wrap: anywhere;
}

.email-summary {
  margin-bottom: 18px;
}

.email-summary strong {
  color: #24313f;
  overflow-wrap: anywhere;
}

.email-status {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.email-status.confirmed {
  background: #edf8f1;
  color: #1f7a45;
}

.email-status.pending {
  background: #fff3cd;
  color: #856404;
}
</style>
