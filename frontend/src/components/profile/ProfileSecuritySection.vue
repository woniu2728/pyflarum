<template>
  <div class="content-section security-section">
    <div class="section-header">
      <div>
        <h2>账号安全</h2>
        <p>查看邮箱验证状态，并修改登录密码。</p>
      </div>
    </div>

    <div class="security-grid">
      <section class="settings-card">
        <div class="security-card-header">
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
          class="btn-secondary"
          :disabled="verificationSending"
          @click="$emit('resend-verification')"
        >
          {{ verificationSending ? '发送中...' : '重新发送验证邮件' }}
        </button>
      </section>

      <section class="settings-card">
        <div class="security-card-header">
          <div>
            <h3>修改密码</h3>
            <p>修改后，下次登录请使用新密码。</p>
          </div>
        </div>

        <ForumInlineMessage v-if="passwordSuccess" tone="success">{{ passwordSuccess }}</ForumInlineMessage>
        <ForumInlineMessage v-if="passwordError" tone="danger">{{ passwordError }}</ForumInlineMessage>

        <div class="form-group">
          <label>当前密码</label>
          <input
            v-model="passwordForm.old_password"
            type="password"
            class="form-control"
            placeholder="请输入当前密码"
          />
        </div>

        <div class="form-group">
          <label>新密码</label>
          <input
            v-model="passwordForm.new_password"
            type="password"
            class="form-control"
            placeholder="请输入新密码"
          />
        </div>

        <div class="form-group">
          <label>确认新密码</label>
          <input
            v-model="passwordForm.confirm_password"
            type="password"
            class="form-control"
            placeholder="请再次输入新密码"
          />
        </div>

        <div class="form-actions">
          <button type="button" class="btn-primary" :disabled="changingPassword" @click="$emit('change-password')">
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

defineEmits(['resend-verification', 'change-password'])
</script>

<style scoped>
.content-section {
  padding: 25px;
  min-height: 200px;
}

.section-header {
  margin-bottom: 24px;
}

.section-header h2 {
  font-size: 22px;
  color: #24313f;
  margin-bottom: 8px;
}

.section-header p {
  color: #6b7a88;
  line-height: 1.6;
}

.security-grid {
  display: grid;
  gap: 18px;
}

.settings-card {
  border: 1px solid #e5ebf0;
  border-radius: 12px;
  padding: 22px 24px;
  background: #fbfcfd;
}

.security-card-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 18px;
}

.security-card-header h3 {
  font-size: 18px;
  color: #24313f;
  margin-bottom: 6px;
}

.security-card-header p,
.email-summary p {
  color: #6b7a88;
  line-height: 1.6;
}

.email-summary {
  margin-bottom: 18px;
}

.email-summary strong {
  color: #24313f;
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

.form-group {
  margin-bottom: 20px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

.form-control {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 3px;
  font-size: 14px;
  font-family: inherit;
}

.form-control:focus {
  outline: none;
  border-color: #4d698e;
}

.form-actions {
  display: flex;
  justify-content: flex-start;
  gap: 10px;
}

.btn-primary,
.btn-secondary {
  padding: 8px 16px;
  border-radius: 3px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-primary {
  background: #4d698e;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #3d5875;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #e3e8ed;
  color: #555;
}

.btn-secondary:hover:not(:disabled) {
  background: #d3d8dd;
}

@media (max-width: 768px) {
  .security-card-header {
    flex-direction: column;
  }
}
</style>
