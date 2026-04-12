<template>
  <Teleport to="body">
    <div
      class="composer-emoji-picker"
      :style="styleObject"
      role="dialog"
      aria-label="选择表情"
      @mousedown.stop
      @click.stop
    >
      <div class="composer-emoji-tabs">
        <button
          v-for="group in groups"
          :key="group.key"
          type="button"
          :class="{ 'is-active': activeKey === group.key }"
          @click="activeKey = group.key"
        >
          {{ group.label }}
        </button>
      </div>

      <div class="composer-emoji-grid">
        <button
          v-for="emoji in activeGroup.emojis"
          :key="emoji"
          type="button"
          :title="emoji"
          @click="$emit('select', emoji)"
        >
          {{ emoji }}
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  groups: {
    type: Array,
    default: () => []
  },
  styleObject: {
    type: Object,
    default: () => ({})
  }
})

defineEmits(['select'])

const activeKey = ref(props.groups[0]?.key || '')
const activeGroup = computed(() => {
  return props.groups.find(group => group.key === activeKey.value) || props.groups[0] || { emojis: [] }
})
</script>

<style scoped>
.composer-emoji-picker {
  position: fixed;
  width: min(320px, calc(100vw - 32px));
  padding: 10px;
  border: 1px solid #d8e0e8;
  border-radius: 10px;
  background: #ffffff;
  box-shadow: 0 14px 32px rgba(31, 45, 61, 0.16);
  z-index: 1200;
}

.composer-emoji-tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 10px;
  overflow-x: auto;
}

.composer-emoji-tabs button,
.composer-emoji-grid button {
  border: 0;
  background: transparent;
  cursor: pointer;
}

.composer-emoji-tabs button {
  padding: 6px 10px;
  border-radius: 999px;
  color: #617182;
  font-size: 12px;
  white-space: nowrap;
}

.composer-emoji-tabs button.is-active,
.composer-emoji-tabs button:hover {
  background: #edf4fb;
  color: #355f8c;
}

.composer-emoji-grid {
  display: grid;
  grid-template-columns: repeat(8, minmax(0, 1fr));
  gap: 6px;
}

.composer-emoji-grid button {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 8px;
  font-size: 20px;
  line-height: 1;
}

.composer-emoji-grid button:hover {
  background: #eef3f8;
}

@media (max-width: 768px) {
  .composer-emoji-picker {
    width: min(320px, calc(100vw - 48px));
  }
}
</style>
