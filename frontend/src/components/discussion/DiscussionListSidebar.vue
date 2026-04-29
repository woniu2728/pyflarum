<template>
  <aside class="index-nav">
    <div class="index-nav-header">
      <button
        v-if="!authStore.isAuthenticated || authStore.canStartDiscussion"
        class="btn-start-discussion"
        :class="{ 'btn-start-discussion--tag': Boolean(currentTag?.color) }"
        :style="startDiscussionButtonStyle"
        @click="$emit('start-discussion')"
      >
        <i class="fas fa-edit"></i>
        发起讨论
      </button>
    </div>

    <nav class="index-nav-list">
      <ul>
        <li>
          <router-link to="/" class="nav-item" :class="{ active: isAllDiscussionsPage }">
            <i class="far fa-comments"></i>
            <span>全部讨论</span>
          </router-link>
        </li>
        <li v-if="authStore.user">
          <router-link to="/following" class="nav-item" :class="{ active: isFollowingPage }">
            <i class="fas fa-bell"></i>
            <span>关注中</span>
          </router-link>
        </li>
        <li v-if="authStore.user">
          <router-link
            :to="buildUserPath(authStore.user)"
            class="nav-item"
            :class="{ active: isOwnProfilePage }"
          >
            <i class="fas fa-user"></i>
            <span>我的主页</span>
          </router-link>
        </li>
        <li v-if="hasSidebarTagNavigation" class="nav-separator" aria-hidden="true"></li>
        <li v-if="hasSidebarTagNavigation">
          <router-link to="/tags" class="nav-item" :class="{ active: isTagsPage }">
            <i class="fas fa-th-large"></i>
            <span>标签</span>
          </router-link>
        </li>
        <li v-for="tag in sidebarPrimaryTagItems" :key="`tag-${tag.id}`">
          <router-link
            :to="buildTagPath(tag)"
            class="nav-item tag-link"
            :class="{
              active: isSidebarTagActive(tag),
              'tag-link--child': Boolean(tag.parent_id)
            }"
            :style="getSidebarTagStyle(tag)"
            :title="tag.description || undefined"
          >
            <span class="tag-link-icon" :class="{ 'tag-link-icon--placeholder': !tag.icon }" aria-hidden="true">
              <i v-if="tag.icon" :class="tag.icon"></i>
              <span v-else class="tag-icon-box"></span>
            </span>
            <span class="tag-link-label">{{ tag.name }}</span>
          </router-link>
        </li>
        <li v-for="tag in sidebarSecondaryTagItems" :key="`secondary-${tag.id}`">
          <router-link
            :to="buildTagPath(tag)"
            class="nav-item tag-link"
            :class="{ active: isSidebarTagActive(tag) }"
            :style="getSidebarTagStyle(tag)"
            :title="tag.description || undefined"
          >
            <span class="tag-link-icon" :class="{ 'tag-link-icon--placeholder': !tag.icon }" aria-hidden="true">
              <i v-if="tag.icon" :class="tag.icon"></i>
              <span v-else class="tag-icon-box"></span>
            </span>
            <span class="tag-link-label">{{ tag.name }}</span>
          </router-link>
        </li>
        <li v-if="showMoreTagsLink">
          <router-link to="/tags" class="nav-item nav-item--muted">
            <i class="fas fa-ellipsis-h"></i>
            <span>更多标签</span>
          </router-link>
        </li>
      </ul>
    </nav>
  </aside>
</template>

<script setup>
defineProps({
  authStore: {
    type: Object,
    required: true
  },
  currentTag: {
    type: Object,
    default: null
  },
  isAllDiscussionsPage: {
    type: Boolean,
    default: false
  },
  isFollowingPage: {
    type: Boolean,
    default: false
  },
  isOwnProfilePage: {
    type: Boolean,
    default: false
  },
  isTagsPage: {
    type: Boolean,
    default: false
  },
  hasSidebarTagNavigation: {
    type: Boolean,
    default: false
  },
  sidebarPrimaryTagItems: {
    type: Array,
    default: () => []
  },
  sidebarSecondaryTagItems: {
    type: Array,
    default: () => []
  },
  showMoreTagsLink: {
    type: Boolean,
    default: false
  },
  startDiscussionButtonStyle: {
    type: Object,
    default: () => ({})
  },
  buildUserPath: {
    type: Function,
    required: true
  },
  buildTagPath: {
    type: Function,
    required: true
  },
  isSidebarTagActive: {
    type: Function,
    required: true
  },
  getSidebarTagStyle: {
    type: Function,
    required: true
  }
})

defineEmits(['start-discussion'])
</script>

<style scoped>
.index-nav {
  width: 240px;
  background: var(--forum-bg-elevated);
  border-right: 1px solid var(--forum-border-color);
  min-height: calc(100vh - 56px);
  position: sticky;
  top: 56px;
  align-self: flex-start;
}

.index-nav-header {
  padding: 18px 18px 12px;
}

.btn-start-discussion {
  width: 100%;
  padding: 10px 14px;
  background: var(--forum-accent-color);
  color: white;
  border: none;
  border-radius: 3px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: filter 0.2s, background 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  line-height: 20px;
  white-space: nowrap;
  user-select: none;
}

.btn-start-discussion:hover {
  filter: brightness(0.92);
}

.btn-start-discussion--tag {
  background: var(--tag-button-bg);
  color: var(--tag-button-text);
}

.btn-start-discussion i {
  font-size: 13px;
}

.index-nav-list {
  padding: 0 18px 24px;
}

.index-nav-list ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.index-nav-list li {
  margin-bottom: 10px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0;
  color: #75808c;
  text-decoration: none;
  transition: color 0.15s ease;
  font-size: 13px;
  font-weight: normal;
  cursor: pointer;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
  border-radius: 3px;
  margin-bottom: 0;
  line-height: 20px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  user-select: none;
  box-shadow: none;
  min-height: 18px;
}

.nav-item:hover {
  background: none;
  color: var(--forum-primary-color);
  text-decoration: none;
}

.nav-item.active {
  background: none;
  color: var(--forum-primary-color);
  font-weight: 700;
}

.nav-item i {
  width: 16px;
  text-align: center;
  font-size: 14px;
}

.nav-separator {
  height: 1px;
  margin: 16px 0 14px;
  background: #e5ebf1;
}

.nav-item--muted {
  color: #8a95a1;
}

.nav-item--muted:hover {
  color: var(--forum-primary-color);
}

.tag-link {
  --tag-color: #6c7a89;
  color: #75808c;
}

.tag-link:hover,
.tag-link.active {
  color: var(--tag-color);
}

.tag-link-icon {
  width: 16px;
  height: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--tag-color);
  font-size: 14px;
}

.tag-link-icon--placeholder {
  color: transparent;
}

.tag-icon-box {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  background: var(--tag-color);
}

.tag-link-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tag-link--child {
  margin-left: 10px;
}

@media (max-width: 768px) {
  .index-nav {
    display: none;
  }
}
</style>
