<template>
  <div :class="['forum-nav-list', rootClass]">
    <template v-for="section in sections" :key="section.key || section.title || 'default'">
      <h4 v-if="section.title" :class="['forum-nav-list__title', sectionTitleClass]">{{ section.title }}</h4>
      <ul :class="['forum-nav-list__section', sectionListClass]">
        <li
          v-for="item in section.items"
          :key="item.key || item.path || item.to || item.label"
          :class="['forum-nav-list__itemWrap', itemWrapperClass]"
        >
          <component
            :is="item.href ? 'a' : 'router-link'"
            :to="item.href ? undefined : item.to"
            :href="item.href || undefined"
            :class="['forum-nav-list__item', itemClass, { active: item.active, 'is-muted': item.muted }]"
            :title="item.description || ''"
            @click="$emit('select', item)"
          >
            <i v-if="item.icon" :class="item.icon"></i>
            <span class="forum-nav-list__content">
              <span class="forum-nav-list__label">{{ item.label }}</span>
              <small
                v-if="showDescriptions && item.description"
                :class="['forum-nav-list__description', itemDescriptionClass]"
              >{{ item.description }}</small>
            </span>
            <span v-if="item.badge" :class="['forum-nav-list__badge', itemBadgeClass]">{{ item.badge }}</span>
          </component>
        </li>
      </ul>
    </template>
  </div>
</template>

<script setup>
defineProps({
  sections: {
    type: Array,
    default: () => []
  },
  rootClass: {
    type: String,
    default: 'forum-nav-list'
  },
  sectionTitleClass: {
    type: String,
    default: 'forum-nav-list__title'
  },
  sectionListClass: {
    type: String,
    default: 'forum-nav-list__section'
  },
  itemWrapperClass: {
    type: String,
    default: 'forum-nav-list__itemWrap'
  },
  itemClass: {
    type: String,
    default: 'forum-nav-list__item'
  },
  itemDescriptionClass: {
    type: String,
    default: 'forum-nav-list__description'
  },
  itemBadgeClass: {
    type: String,
    default: 'forum-nav-list__badge'
  },
  showDescriptions: {
    type: Boolean,
    default: true
  }
})

defineEmits(['select'])
</script>

<style scoped>
.forum-nav-list {
  min-width: 0;
}

.forum-nav-list__title {
  margin: 0;
}

.forum-nav-list__section {
  list-style: none;
  padding: 0;
  margin: 0;
}

.forum-nav-list__itemWrap {
  list-style: none;
  margin: 0;
}

.forum-nav-list__item {
  display: flex;
  align-items: center;
  gap: 10px;
  position: relative;
  text-decoration: none;
}

.forum-nav-list__content {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.forum-nav-list__label {
  min-width: 0;
}

.forum-nav-list__item i {
  width: 18px;
  text-align: center;
  flex-shrink: 0;
}

.forum-nav-list__description {
  display: block;
}

.forum-nav-list__badge {
  margin-left: auto;
  min-width: 18px;
  padding: 1px 6px;
  border-radius: 999px;
  font-size: 11px;
  text-align: center;
}
</style>
