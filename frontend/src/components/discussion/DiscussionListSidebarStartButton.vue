<template>
  <button
    class="btn-start-discussion"
    :class="{ 'btn-start-discussion--tag': Boolean(currentTag?.color) }"
    :style="startDiscussionButtonStyle"
    @click="$emit('click')"
  >
    <i class="fas fa-edit"></i>
    发起讨论
  </button>
</template>

<script setup>
defineProps({
  currentTag: {
    type: Object,
    default: null
  },
  startDiscussionButtonStyle: {
    type: Object,
    default: () => ({})
  }
})

defineEmits(['click'])
</script>

<style scoped>
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
</style>
