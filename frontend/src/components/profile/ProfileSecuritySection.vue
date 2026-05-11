<template>
  <div class="profile-section security-section">
    <div class="profile-section-header">
      <div>
        <h2>{{ securitySectionTitleText }}</h2>
        <p>{{ securitySectionDescriptionText }}</p>
      </div>
    </div>

    <div class="security-grid">
      <section class="profile-settings-card">
        <div class="profile-card-header">
          <div>
            <h3>{{ emailSectionTitleText }}</h3>
            <p>{{ emailSectionDescriptionText }}</p>
          </div>
          <span
            class="email-status"
            :class="{ confirmed: user.is_email_confirmed, pending: !user.is_email_confirmed }"
          >
            {{ emailStatusText }}
          </span>
        </div>

        <div class="email-summary">
          <strong>{{ user.email }}</strong>
          <p>{{ emailHelpText }}</p>
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
          {{ resendVerificationButtonText }}
        </button>
      </section>

      <section class="profile-settings-card">
        <div class="profile-card-header">
          <div>
            <h3>{{ passwordSectionTitleText }}</h3>
            <p>{{ passwordSectionDescriptionText }}</p>
          </div>
        </div>

        <ForumInlineMessage v-if="passwordSuccess" tone="success">{{ passwordSuccess }}</ForumInlineMessage>
        <ForumInlineMessage v-if="passwordError" tone="danger">{{ passwordError }}</ForumInlineMessage>

        <div class="profile-form-group">
          <label for="profile-old-password">{{ oldPasswordLabelText }}</label>
          <input
            id="profile-old-password"
            class="profile-form-control"
            :value="passwordForm.old_password"
            name="old_password"
            :placeholder="oldPasswordPlaceholderText"
            type="password"
            @input="$emit('update-password-form', { key: 'old_password', value: $event.target.value })"
          />
        </div>

        <div class="profile-form-group">
          <label for="profile-new-password">{{ newPasswordLabelText }}</label>
          <input
            id="profile-new-password"
            class="profile-form-control"
            :value="passwordForm.new_password"
            name="new_password"
            :placeholder="newPasswordPlaceholderText"
            type="password"
            @input="$emit('update-password-form', { key: 'new_password', value: $event.target.value })"
          />
        </div>

        <div class="profile-form-group">
          <label for="profile-confirm-password">{{ confirmPasswordLabelText }}</label>
          <input
            id="profile-confirm-password"
            class="profile-form-control"
            :value="passwordForm.confirm_password"
            name="confirm_password"
            :placeholder="confirmPasswordPlaceholderText"
            type="password"
            @input="$emit('update-password-form', { key: 'confirm_password', value: $event.target.value })"
          />
        </div>

        <div class="profile-form-actions">
          <button type="button" class="primary" :disabled="changingPassword" @click="$emit('change-password')">
            {{ changePasswordButtonText }}
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import ForumInlineMessage from '@/components/forum/ForumInlineMessage.vue'
import { getUiCopy } from '@/forum/registry'

const props = defineProps({
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
const securitySectionTitleText = computed(() => getUiCopy({
  surface: 'profile-security-section-title',
})?.text || '账号安全')
const securitySectionDescriptionText = computed(() => getUiCopy({
  surface: 'profile-security-section-description',
})?.text || '查看邮箱验证状态，并修改登录密码。')
const emailSectionTitleText = computed(() => getUiCopy({
  surface: 'profile-security-email-section-title',
})?.text || '邮箱验证')
const emailSectionDescriptionText = computed(() => getUiCopy({
  surface: 'profile-security-email-section-description',
})?.text || '验证邮箱后，可确保找回密码和安全通知正常送达。')
const emailStatusText = computed(() => getUiCopy({
  surface: 'profile-security-status-label',
  isEmailConfirmed: props.user.is_email_confirmed,
})?.text || (props.user.is_email_confirmed ? '已验证' : '未验证'))
const emailHelpText = computed(() => getUiCopy({
  surface: 'profile-security-email-help',
  isEmailConfirmed: props.user.is_email_confirmed,
})?.text || (props.user.is_email_confirmed ? '当前邮箱已通过验证。' : '当前邮箱尚未验证，你可以重新发送验证邮件。'))
const passwordSectionTitleText = computed(() => getUiCopy({
  surface: 'profile-security-password-section-title',
})?.text || '修改密码')
const passwordSectionDescriptionText = computed(() => getUiCopy({
  surface: 'profile-security-password-section-description',
})?.text || '修改后，下次登录请使用新密码。')
const oldPasswordLabelText = computed(() => getUiCopy({
  surface: 'profile-security-old-password-label',
})?.text || '当前密码')
const newPasswordLabelText = computed(() => getUiCopy({
  surface: 'profile-security-new-password-label',
})?.text || '新密码')
const confirmPasswordLabelText = computed(() => getUiCopy({
  surface: 'profile-security-confirm-password-label',
})?.text || '确认新密码')
const resendVerificationButtonText = computed(() => getUiCopy({
  surface: 'profile-security-resend-button',
  sending: props.verificationSending,
})?.text || (props.verificationSending ? '发送中...' : '重新发送验证邮件'))
const oldPasswordPlaceholderText = computed(() => getUiCopy({
  surface: 'profile-security-old-password-placeholder',
})?.text || '请输入当前密码')
const newPasswordPlaceholderText = computed(() => getUiCopy({
  surface: 'profile-security-new-password-placeholder',
})?.text || '请输入新密码')
const confirmPasswordPlaceholderText = computed(() => getUiCopy({
  surface: 'profile-security-confirm-password-placeholder',
})?.text || '请再次输入新密码')
const changePasswordButtonText = computed(() => getUiCopy({
  surface: 'profile-security-submit-button',
  submitting: props.changingPassword,
})?.text || (props.changingPassword ? '提交中...' : '更新密码'))

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
