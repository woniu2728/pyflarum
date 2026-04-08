<template>
  <div class="auth-page">
    <div class="auth-container">
      <div class="auth-card">
        <h2>登录</h2>
        <p class="subtitle">欢迎回来！</p>

        <form @submit.prevent="handleLogin">
          <div class="form-group">
            <label>用户名或邮箱</label>
            <input
              v-model="form.identification"
              type="text"
              placeholder="请输入用户名或邮箱"
              required
            />
          </div>

          <div class="form-group">
            <label>密码</label>
            <input
              v-model="form.password"
              type="password"
              placeholder="请输入密码"
              required
            />
          </div>

          <div class="form-actions">
            <label class="checkbox">
              <input v-model="form.remember" type="checkbox" />
              <span>记住我</span>
            </label>
            <router-link to="/forgot-password" class="link">忘记密码？</router-link>
          </div>

          <div v-if="error" class="error-message">{{ error }}</div>

          <button type="submit" class="primary full-width" :disabled="loading">
            {{ loading ? '登录中...' : '登录' }}
          </button>
        </form>

        <div class="auth-footer">
          还没有账号？
          <router-link to="/register" class="link">立即注册</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notification'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const notificationStore = useNotificationStore()

const form = ref({
  identification: '',
  password: '',
  remember: false
})

const loading = ref(false)
const error = ref('')

async function handleLogin() {
  loading.value = true
  error.value = ''

  try {
    await authStore.login(form.value.identification, form.value.password)

    // 连接WebSocket
    notificationStore.connect()
    notificationStore.requestPermission()

    // 重定向到原页面或首页
    const redirect = route.query.redirect || '/'
    router.push(redirect)
  } catch (err) {
    error.value = err.response?.data?.detail || '登录失败，请检查用户名和密码'
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
  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
}

.auth-card h2 {
  margin-bottom: 10px;
  color: #333;
  font-size: 28px;
}

.subtitle {
  color: #666;
  margin-bottom: 30px;
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

.form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.checkbox input {
  width: auto;
}

.link {
  color: #667eea;
  font-size: 14px;
}

.link:hover {
  text-decoration: underline;
}

.error-message {
  background: #fee;
  color: #c33;
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
  color: #666;
  font-size: 14px;
}
</style>
