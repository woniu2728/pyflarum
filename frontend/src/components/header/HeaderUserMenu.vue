<template>
  <div class="user-dropdown" @click="$emit('toggle')">
    <img
      v-if="authStore.user?.avatar_url"
      :src="authStore.user.avatar_url"
      :alt="authStore.user?.username"
      class="avatar avatar-image"
    />
    <div v-else class="avatar" :style="{ backgroundColor: getUserAvatarColor(authStore.user) }">
      {{ getUserInitial(authStore.user) }}
    </div>
    <span class="username">{{ authStore.user?.username }}</span>
    <i class="fas fa-caret-down"></i>

    <div v-if="showUserMenu" class="dropdown-menu">
      <router-link :to="profilePath()" class="dropdown-item">
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
      <a class="dropdown-item" @click.prevent="$emit('logout')">
        <i class="fas fa-sign-out-alt"></i>
        <span>登出</span>
      </a>
    </div>
  </div>
</template>

<script setup>
defineProps({
  authStore: {
    type: Object,
    required: true
  },
  showUserMenu: {
    type: Boolean,
    default: false
  },
  profilePath: {
    type: Function,
    required: true
  },
  getUserAvatarColor: {
    type: Function,
    required: true
  },
  getUserInitial: {
    type: Function,
    required: true
  }
})

defineEmits(['toggle', 'logout'])
</script>

<style scoped>
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
  background: var(--forum-primary-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
}

.avatar-image {
  object-fit: cover;
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
</style>
