<template>
  <button
    type="button"
    class="btn-start-discussion"
    @click="$emit('click')"
  >
    <i class="fas fa-edit"></i>
    发起讨论
  </button>
</template>

<script setup>
defineEmits(['click'])
</script>

<style scoped>
.btn-start-discussion {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: var(--forum-accent-color);
  color: var(--forum-text-inverse);
  margin-bottom: 16px;
  border-radius: var(--forum-radius-pill);
}

.btn-start-discussion:hover {
  background: var(--forum-accent-strong);
}
</style>
