<template>
  <div class="tag-cloud">
    <router-link
      v-for="tag in tags"
      :key="tag.id"
      :to="buildTagPath(tag)"
      class="tag-cloud-item"
      :style="{ '--tag-color': tag.color }"
    >
      {{ tag.name }}
    </router-link>
  </div>
</template>

<script setup>
import { buildTagPath } from '@/utils/forum'

defineProps({
  tags: {
    type: Array,
    default: () => []
  }
})
</script>

<style scoped>
.tag-cloud {
  margin-top: 22px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.tag-cloud-item {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--tag-color) 25%, white);
  color: #314150;
  background: color-mix(in srgb, var(--tag-color) 10%, white);
}

.tag-cloud-item:hover {
  text-decoration: none;
  background: color-mix(in srgb, var(--tag-color) 18%, white);
}
</style>
