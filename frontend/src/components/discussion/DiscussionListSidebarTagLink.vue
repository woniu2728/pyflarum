<template>
  <router-link
    :to="buildTagPath(tag)"
    class="nav-item tag-link"
    :class="{
      active: isActive,
      'tag-link--child': isChild
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
</template>

<script setup>
defineProps({
  buildTagPath: {
    type: Function,
    required: true
  },
  getSidebarTagStyle: {
    type: Function,
    required: true
  },
  isActive: {
    type: Boolean,
    default: false
  },
  isChild: {
    type: Boolean,
    default: false
  },
  tag: {
    type: Object,
    required: true
  }
})
</script>

<style scoped>
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
  text-decoration: none;
}

.nav-item.active {
  font-weight: 700;
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
</style>
