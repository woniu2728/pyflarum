<template>
  <nav class="search-filters">
    <button
      v-for="item in items"
      :key="item.value"
      type="button"
      class="filter-item"
      :class="{ active: activeValue === item.value }"
      @click="$emit('change', item.value)"
    >
      <span>{{ item.label }}</span>
      <strong>{{ item.count }}</strong>
    </button>
  </nav>
</template>

<script setup>
defineProps({
  activeValue: {
    type: String,
    required: true
  },
  items: {
    type: Array,
    default: () => []
  }
})

defineEmits(['change'])
</script>

<style scoped>
.search-filters {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-item {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: var(--forum-radius-sm);
  background: transparent;
  color: var(--forum-text-muted);
}

.filter-item:hover {
  background: var(--forum-bg-subtle);
}

.filter-item.active {
  background: var(--forum-primary-color);
  color: var(--forum-text-inverse);
}

.filter-item strong {
  font-size: 12px;
}
</style>
