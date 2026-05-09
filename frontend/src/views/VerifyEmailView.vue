<template>
  <div class="auth-page">
    <div class="auth-container">
      <div class="auth-card">
        <h2>{{ titleText }}</h2>
        <p class="subtitle">{{ subtitleText }}</p>

        <div v-if="loading" class="status-box">
          {{ loadingText }}
        </div>
        <div v-else-if="success" class="status-box status-success">
          {{ success }}
        </div>
        <div v-else-if="error" class="status-box status-error">
          {{ error }}
        </div>
        <div v-else class="status-box">
          {{ idleText }}
        </div>

        <div class="actions">
          <router-link to="/login" class="primary action-link">{{ loginActionText }}</router-link>
          <router-link to="/profile" class="secondary action-link">{{ profileActionText }}</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getUiCopy } from '@/forum/registry'
import api from '@/api'

const route = useRoute()
const authStore = useAuthStore()

const loading = ref(false)
const success = ref('')
const error = ref('')
const titleText = computed(() => getUiCopy({
  surface: 'verify-email-title',
})?.text || '验证邮箱')
const subtitleText = computed(() => getUiCopy({
  surface: 'verify-email-subtitle',
})?.text || '确认你的邮箱地址后，账号安全设置会完整开放。')
const loadingText = computed(() => getUiCopy({
  surface: 'verify-email-loading',
})?.text || '正在验证邮箱，请稍候...')
const idleText = computed(() => getUiCopy({
  surface: 'verify-email-idle',
})?.text || '请从邮件中的链接打开本页面，或确认地址中的验证令牌是否完整。')
const loginActionText = computed(() => getUiCopy({
  surface: 'verify-email-login-action',
})?.text || '前往登录')
const profileActionText = computed(() => getUiCopy({
  surface: 'verify-email-profile-action',
})?.text || '返回个人资料')

watch(
  () => route.query.token,
  async (value) => {
    const token = value?.toString().trim()
    success.value = ''
    error.value = ''

    if (!token) {
      return
    }

    loading.value = true
    try {
      await api.post('/users/verify-email', { token })
      if (authStore.isAuthenticated) {
        await authStore.fetchUser()
      }
      success.value = getUiCopy({
        surface: 'verify-email-success',
      })?.text || '邮箱验证成功。现在你可以继续登录，或返回个人资料查看最新状态。'
    } catch (err) {
      error.value = err.response?.data?.error || (getUiCopy({
        surface: 'verify-email-error',
      })?.text || '邮箱验证失败，请稍后重试')
    } finally {
      loading.value = false
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.auth-page {
  min-height: calc(100vh - 200px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  background: linear-gradient(135deg, #d7e6f5 0%, #f4f8fb 100%);
}

.auth-container {
  width: 100%;
  max-width: 520px;
}

.auth-card {
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 16px 42px rgba(47, 60, 77, 0.12);
}

.auth-card h2 {
  margin-bottom: 10px;
  color: #24313f;
  font-size: 28px;
}

.subtitle {
  color: #667684;
  margin-bottom: 24px;
  line-height: 1.6;
}

.status-box {
  padding: 16px 18px;
  border-radius: 10px;
  background: #f5f8fa;
  color: #556270;
  line-height: 1.7;
}

.status-success {
  background: #edf8f1;
  color: #1f7a45;
}

.status-error {
  background: #fdf0f0;
  color: #b03a37;
}

.actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.action-link {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
}

.action-link:hover {
  text-decoration: none;
}
</style>
