<template>
  <aside class="user-sidebar">
    <nav class="side-nav">
      <ul>
        <li v-for="item in items" :key="item.key">
          <a
            class="nav-link"
            :class="{ active: activeTab === item.key }"
            @click.prevent="$emit('change-tab', item.key)"
          >
            <i :class="item.icon"></i>
            <span>{{ item.label }}</span>
            <span v-if="typeof item.count === 'number'" class="badge-count">{{ item.count }}</span>
          </a>
        </li>
      </ul>
    </nav>
  </aside>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  activeTab: {
    type: String,
    required: true
  },
  isOwnProfile: {
    type: Boolean,
    default: false
  },
  user: {
    type: Object,
    required: true
  }
})

defineEmits(['change-tab'])

const items = computed(() => {
  const baseItems = [
    {
      key: 'discussions',
      label: '讨论',
      icon: 'fas fa-bars',
      count: props.user.discussion_count || 0
    },
    {
      key: 'posts',
      label: '回复',
      icon: 'far fa-comment',
      count: props.user.comment_count || 0
    }
  ]

  if (!props.isOwnProfile) {
    return baseItems
  }

  return [
    ...baseItems,
    {
      key: 'settings',
      label: '设置',
      icon: 'fas fa-user-cog'
    },
    {
      key: 'security',
      label: '安全',
      icon: 'fas fa-shield-alt'
    }
  ]
})
</script>

<style scoped>
.user-sidebar {
  position: sticky;
  top: 76px;
  height: fit-content;
}

.side-nav ul {
  list-style: none;
  padding: 0;
  margin: 0;
  background: white;
  border: 1px solid #e3e8ed;
  border-radius: 3px;
  overflow: hidden;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  color: #555;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.15s;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
}

.side-nav ul li:last-child .nav-link {
  border-bottom: none;
}

.nav-link:hover {
  background: #f8fafb;
  text-decoration: none;
  color: #333;
}

.nav-link.active {
  background: #4d698e;
  color: white;
}

.nav-link i {
  width: 18px;
  text-align: center;
  font-size: 15px;
}

.nav-link span:first-of-type {
  flex: 1;
  font-weight: 500;
}

.badge-count {
  background: rgba(0, 0, 0, 0.08);
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  min-width: 24px;
  text-align: center;
}

.nav-link.active .badge-count {
  background: rgba(255, 255, 255, 0.25);
}

@media (max-width: 768px) {
  .user-sidebar {
    position: static;
  }
}
</style>
