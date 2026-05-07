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

    <div v-if="showUserMenu" class="dropdown-menu" @click.stop>
      <template v-for="item in items" :key="item.key">
        <div v-if="item.separated" class="dropdown-divider"></div>
        <component
          :is="item.to ? 'router-link' : item.href ? 'a' : 'button'"
          v-bind="item.to ? { to: item.to } : item.href ? { href: item.href } : { type: 'button' }"
          class="dropdown-item"
          :class="{
            'dropdown-item--danger': item.tone === 'danger',
            'dropdown-item--active': item.active
          }"
          @click="$emit('item-click', item, $event)"
        >
          <i v-if="item.icon" :class="item.icon"></i>
          <span>{{ item.label }}</span>
          <strong v-if="item.badge" class="dropdown-badge">{{ item.badge }}</strong>
        </component>
      </template>
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
  items: {
    type: Array,
    default: () => []
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

defineEmits(['toggle', 'item-click'])
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
  max-width: 88px;
  font-size: 14px;
  color: #555;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

.dropdown-item--active {
  background: #f5f8fa;
  color: #31465d;
}

.dropdown-item i {
  width: 16px;
  font-size: 14px;
  color: #999;
}

.dropdown-item--danger,
.dropdown-item--danger i {
  color: #e74c3c;
}

.dropdown-badge {
  margin-left: auto;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 999px;
  background: rgba(77, 105, 142, 0.12);
  color: var(--forum-primary-color);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.dropdown-divider {
  height: 1px;
  background: #e3e8ed;
  margin: 5px 0;
}
</style>
