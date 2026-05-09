<template>
  <div class="auth-page">
    <div class="auth-container">
      <div class="auth-card">
        <h2>{{ titleText }}</h2>
        <p class="subtitle">{{ subtitleText }}</p>

        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label for="reset-password-token">{{ tokenLabelText }}</label>
            <input
              id="reset-password-token"
              v-model="form.token"
              name="token"
              type="text"
              :placeholder="tokenPlaceholderText"
              autocomplete="one-time-code"
              required
            />
          </div>

          <div class="form-group">
            <label for="reset-password-new">{{ newPasswordLabelText }}</label>
            <input
              id="reset-password-new"
              v-model="form.password"
              name="password"
              type="password"
              :placeholder="newPasswordPlaceholderText"
              autocomplete="new-password"
              minlength="6"
              required
            />
          </div>

          <div class="form-group">
            <label for="reset-password-confirm">{{ confirmPasswordLabelText }}</label>
            <input
              id="reset-password-confirm"
              v-model="form.passwordConfirm"
              name="password_confirm"
              type="password"
              :placeholder="confirmPasswordPlaceholderText"
              autocomplete="new-password"
              minlength="6"
              required
            />
          </div>

          <div v-if="error" class="error-message">{{ error }}</div>
          <div v-if="success" class="success-message">{{ success }}</div>

          <button type="submit" class="primary full-width" :disabled="loading">
            {{ submitButtonText }}
          </button>
        </form>

        <div class="auth-footer">
          <router-link to="/login" class="link">{{ backToLoginText }}</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/api'
import { getUiCopy } from '@/forum/registry'

const route = useRoute()
const router = useRouter()

const form = reactive({
  token: route.query.token?.toString() || '',
  password: '',
  passwordConfirm: ''
})

const loading = ref(false)
const error = ref('')
const success = ref('')
const titleText = computed(() => getUiCopy({
  surface: 'reset-password-title',
})?.text || '重置密码')
const subtitleText = computed(() => getUiCopy({
  surface: 'reset-password-subtitle',
})?.text || '输入新的密码以完成重置。如果你是通过邮件打开页面，令牌会自动填入。')
const tokenLabelText = computed(() => getUiCopy({
  surface: 'reset-password-token-label',
})?.text || '重置令牌')
const newPasswordLabelText = computed(() => getUiCopy({
  surface: 'reset-password-new-label',
})?.text || '新密码')
const confirmPasswordLabelText = computed(() => getUiCopy({
  surface: 'reset-password-confirm-label',
})?.text || '确认新密码')
const tokenPlaceholderText = computed(() => getUiCopy({
  surface: 'reset-password-token-placeholder',
})?.text || '请输入邮件中的重置令牌')
const newPasswordPlaceholderText = computed(() => getUiCopy({
  surface: 'reset-password-new-placeholder',
})?.text || '请输入新密码')
const confirmPasswordPlaceholderText = computed(() => getUiCopy({
  surface: 'reset-password-confirm-placeholder',
})?.text || '请再次输入新密码')
const submitButtonText = computed(() => getUiCopy({
  surface: 'reset-password-submit',
  loading: loading.value,
})?.text || (loading.value ? '提交中...' : '重置密码'))
const backToLoginText = computed(() => getUiCopy({
  surface: 'reset-password-back-to-login',
})?.text || '返回登录')

watch(
  () => route.query.token,
  (value) => {
    form.token = value?.toString() || ''
  }
)

async function handleSubmit() {
  error.value = ''
  success.value = ''

  if (form.password !== form.passwordConfirm) {
    error.value = getUiCopy({
      surface: 'reset-password-mismatch-error',
    })?.text || '两次输入的新密码不一致'
    return
  }

  loading.value = true
  try {
    await api.post('/users/reset-password', {
      token: form.token,
      password: form.password
    })

    success.value = getUiCopy({
      surface: 'reset-password-success',
    })?.text || '密码已重置，正在返回登录页...'
    setTimeout(() => {
      router.push('/login')
    }, 1500)
  } catch (err) {
    error.value = err.response?.data?.error || (getUiCopy({
      surface: 'reset-password-error',
    })?.text || '重置失败，请检查令牌或稍后重试')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page {
  min-height: calc(100vh - 200px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.auth-container {
  width: 100%;
  max-width: 450px;
}

.auth-card {
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.auth-card h2 {
  margin-bottom: 10px;
  color: #333;
  font-size: 28px;
}

.subtitle {
  color: #666;
  margin-bottom: 30px;
  line-height: 1.6;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
}

.error-message {
  background: #fee;
  color: #c33;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 20px;
  font-size: 14px;
}

.success-message {
  background: #efe;
  color: #2f7a36;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 20px;
  font-size: 14px;
}

.full-width {
  width: 100%;
}

.auth-footer {
  text-align: center;
  margin-top: 20px;
}

.link {
  color: #667eea;
}

.link:hover {
  text-decoration: underline;
}
</style>
