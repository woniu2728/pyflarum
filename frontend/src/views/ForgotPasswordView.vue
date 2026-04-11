<template>
  <div class="auth-page">
    <div class="auth-container">
      <div class="auth-card">
        <h2>忘记密码</h2>
        <p class="subtitle">输入注册邮箱，我们会向你发送重置密码链接。</p>

        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label>邮箱</label>
            <input
              v-model="email"
              type="email"
              placeholder="请输入注册邮箱"
              required
            />
          </div>

          <div v-if="error" class="error-message">{{ error }}</div>
          <div v-if="success" class="success-message">{{ success }}</div>
          <div v-if="debugResetUrl" class="debug-panel">
            <div class="debug-title">开发环境调试链接</div>
            <router-link :to="debugResetPath" class="debug-link">
              {{ debugResetPath }}
            </router-link>
          </div>

          <button type="submit" class="primary full-width" :disabled="loading">
            {{ loading ? '发送中...' : '发送重置链接' }}
          </button>
        </form>

        <div class="auth-footer">
          <router-link to="/login" class="link">返回登录</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import api from '@/api'

const email = ref('')
const loading = ref(false)
const error = ref('')
const success = ref('')
const debugResetUrl = ref('')

const debugResetPath = computed(() => {
  if (!debugResetUrl.value) return '/reset-password'

  try {
    const url = new URL(debugResetUrl.value)
    return `${url.pathname}${url.search}`
  } catch (e) {
    return '/reset-password'
  }
})

async function handleSubmit() {
  loading.value = true
  error.value = ''
  success.value = ''
  debugResetUrl.value = ''

  try {
    const response = await api.post('/users/forgot-password', {
      email: email.value
    })

    success.value = response.message || '重置链接已发送，请检查邮箱。'
    debugResetUrl.value = response.debug_reset_url || ''
  } catch (err) {
    error.value = err.response?.data?.error || '发送失败，请稍后重试'
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

.debug-panel {
  background: #f5f8ff;
  border: 1px solid #d7e2ff;
  color: #445;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 20px;
  font-size: 13px;
}

.debug-title {
  font-weight: 600;
  margin-bottom: 8px;
}

.debug-link {
  word-break: break-all;
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
