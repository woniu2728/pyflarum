<template>
  <div id="admin-app">
    <AdminHeader />
    <div class="Admin-content">
      <div class="container">
        <AdminNav />
        <div class="Admin-main">
          <router-view />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import AdminHeader from './components/AdminHeader.vue'
import AdminNav from './components/AdminNav.vue'
import { useAuthStore } from '../stores/auth'
import { useRouter, useRoute } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

onMounted(async () => {
  // 检查认证状态
  await authStore.checkAuth()

  // 检查是否是管理员
  if (!authStore.user?.is_staff) {
    alert('需要管理员权限')
    window.location.href = '/'
    return
  }

  // 如果当前路径不是 /admin 开头，重定向到仪表盘
  if (!route.path.startsWith('/admin')) {
    router.replace('/admin')
  }
})
</script>

<style>
#admin-app {
  min-height: 100vh;
  background: #f5f8fa;
}

.Admin-content {
  padding-top: 56px;
}

.Admin-content .container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 30px 20px;
  display: flex;
  align-items: flex-start;
  gap: 30px;
}

.Admin-main {
  flex: 1;
  min-width: 0;
}

@media (max-width: 960px) {
  .Admin-content .container {
    flex-direction: column;
    gap: 18px;
    padding: 18px 14px 28px;
  }
}

@media (max-width: 768px) {
  .Admin-content {
    padding-top: 72px;
  }

  .Admin-content .container {
    padding: 14px 12px 24px;
    gap: 14px;
  }
}
</style>
