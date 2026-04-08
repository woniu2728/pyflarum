<template>
  <header class="header">
    <div class="container">
      <div class="header-left">
        <div class="logo">
          <router-link to="/">PyFlarum</router-link>
        </div>
      </div>

      <div class="header-right">
        <!-- 搜索框 -->
        <div class="search-box">
          <i class="fas fa-search"></i>
          <input
            type="text"
            placeholder="搜索论坛"
            v-model="searchQuery"
            @keyup.enter="handleSearch"
          />
        </div>

        <template v-if="authStore.isAuthenticated">
          <!-- 通知 -->
          <div class="header-icon" @click="toggleNotifications">
            <i class="fas fa-bell"></i>
            <span v-if="notificationStore.unreadCount > 0" class="badge">
              {{ notificationStore.unreadCount }}
            </span>
          </div>

          <!-- 用户菜单 -->
          <div class="user-dropdown" @click="toggleUserMenu">
            <div class="avatar">
              {{ authStore.user?.username.charAt(0).toUpperCase() }}
            </div>
            <span class="username">{{ authStore.user?.username }}</span>
            <i class="fas fa-caret-down"></i>

            <!-- 下拉菜单 -->
            <div v-if="showUserMenu" class="dropdown-menu">
              <router-link to="/profile" class="dropdown-item">
                <i class="fas fa-user"></i>
                <span>个人资料</span>
              </router-link>
              <router-link to="/notifications" class="dropdown-item">
                <i class="fas fa-bell"></i>
                <span>通知</span>
              </router-link>
              <a
                v-if="authStore.user?.is_staff"
                href="/admin.html"
                class="dropdown-item admin-link"
              >
                <i class="fas fa-cog"></i>
                <span>管理后台</span>
              </a>
              <div class="dropdown-divider"></div>
              <a @click.prevent="handleLogout" class="dropdown-item">
                <i class="fas fa-sign-out-alt"></i>
                <span>登出</span>
              </a>
            </div>
          </div>
        </template>

        <template v-else>
          <router-link to="/login" class="btn-login">
            登录
          </router-link>
          <router-link to="/register" class="btn-signup">
            注册
          </router-link>
        </template>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notification'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const notificationStore = useNotificationStore()
const router = useRouter()

const showUserMenu = ref(false)
const searchQuery = ref('')

function toggleUserMenu() {
  showUserMenu.value = !showUserMenu.value
}

function toggleNotifications() {
  router.push('/notifications')
}

function handleSearch() {
  if (searchQuery.value.trim()) {
    router.push({ path: '/', query: { search: searchQuery.value } })
  }
}

function handleLogout() {
  authStore.logout()
  notificationStore.disconnect()
  showUserMenu.value = false
  router.push('/')
}

// 点击外部关闭菜单
if (typeof window !== 'undefined') {
  window.addEventListener('click', (e) => {
    if (!e.target.closest('.user-dropdown')) {
      showUserMenu.value = false
    }
  })
}
</script>

<style scoped>
.header {
  background: white;
  border-bottom: 1px solid #e3e8ed;
  position: sticky;
  top: 0;
  z-index: 100;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.logo a {
  font-size: 18px;
  font-weight: 600;
  color: #4d698e;
  letter-spacing: -0.5px;
}

.logo a:hover {
  text-decoration: none;
}

.nav {
  display: flex;
  gap: 5px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  color: #555;
  font-size: 14px;
  border-radius: 3px;
  transition: all 0.2s;
}

.nav-item i {
  font-size: 14px;
}

.nav-item:hover {
  background: #f5f8fa;
  color: #333;
  text-decoration: none;
}

.nav-item.router-link-active {
  color: #4d698e;
  font-weight: 500;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* 搜索框 */
.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: #f5f8fa;
  border-radius: 3px;
  border: 1px solid transparent;
  transition: all 0.2s;
  width: 200px;
}

.search-box:focus-within {
  background: white;
  border-color: #4d698e;
}

.search-box i {
  color: #999;
  font-size: 14px;
}

.search-box input {
  border: none;
  background: none;
  outline: none;
  font-size: 13px;
  color: #333;
  width: 100%;
}

.search-box input::placeholder {
  color: #999;
}

/* 发帖按钮 */
.btn-compose {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 15px;
  background: #4d698e;
  color: white;
  border-radius: 3px;
  font-size: 13px;
  font-weight: 500;
  transition: background 0.2s;
}

.btn-compose:hover {
  background: #3d5875;
  text-decoration: none;
}

.btn-compose i {
  font-size: 13px;
}

/* 图标按钮 */
.header-icon {
  position: relative;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
  color: #555;
  cursor: pointer;
  transition: background 0.2s;
}

.header-icon:hover {
  background: #f5f8fa;
}

.header-icon i {
  font-size: 16px;
}

.badge {
  position: absolute;
  top: 6px;
  right: 6px;
  background: #e74c3c;
  color: white;
  border-radius: 10px;
  padding: 2px 5px;
  font-size: 10px;
  font-weight: 600;
  min-width: 16px;
  text-align: center;
  line-height: 1;
}

/* 用户下拉菜单 */
.user-dropdown {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 3px;
  cursor: pointer;
  transition: background 0.2s;
}

.user-dropdown:hover {
  background: #f5f8fa;
}

.avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #4d698e;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
}

.username {
  font-size: 14px;
  color: #555;
  font-weight: 500;
}

.user-dropdown i.fa-caret-down {
  font-size: 12px;
  color: #999;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  background: white;
  border: 1px solid #e3e8ed;
  border-radius: 3px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  min-width: 200px;
  z-index: 1000;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 15px;
  color: #555;
  font-size: 14px;
  transition: background 0.2s;
  cursor: pointer;
}

.dropdown-item:hover {
  background: #f5f8fa;
  text-decoration: none;
}

.dropdown-item i {
  width: 16px;
  font-size: 14px;
  color: #999;
}

.dropdown-item.admin-link {
  color: #e74c3c;
}

.dropdown-item.admin-link i {
  color: #e74c3c;
}

.dropdown-divider {
  height: 1px;
  background: #e3e8ed;
  margin: 5px 0;
}

/* 登录/注册按钮 */
.btn-login,
.btn-signup {
  padding: 8px 15px;
  font-size: 13px;
  font-weight: 500;
  border-radius: 3px;
  transition: all 0.2s;
}

.btn-login {
  color: #555;
  background: transparent;
}

.btn-login:hover {
  background: #f5f8fa;
  text-decoration: none;
}

.btn-signup {
  background: #4d698e;
  color: white;
}

.btn-signup:hover {
  background: #3d5875;
  text-decoration: none;
}

@media (max-width: 768px) {
  .nav-item span,
  .btn-compose span {
    display: none;
  }

  .username {
    display: none;
  }
}
</style>
