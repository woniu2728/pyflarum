<template>
  <DiscussionEventPostBase
    :post="post"
    :is-target="isTarget"
    :icon="resolvedIcon"
    :variant="variant"
    :format-absolute-date="formatAbsoluteDate"
    :format-date="formatDate"
    @jump-to-post="$emit('jump-to-post', $event)"
  >
    <template #line>
      <strong>{{ actorName }}</strong>
      <span>{{ resolvedLabel }}</span>
      <span v-if="resolvedDescription" class="generic-event-post-description">{{ resolvedDescription }}</span>
    </template>
  </DiscussionEventPostBase>
</template>

<script setup>
import { computed } from 'vue'
import DiscussionEventPostBase from '@/components/discussion/DiscussionEventPostBase.vue'

const props = defineProps({
  post: { type: Object, required: true },
  isTarget: { type: Boolean, default: false },
  getUserDisplayName: { type: Function, required: true },
  formatAbsoluteDate: { type: Function, required: true },
  formatDate: { type: Function, required: true }
})

defineEmits(['jump-to-post'])

const actorName = computed(() => props.getUserDisplayName(props.post.user))
const resolvedLabel = computed(() => props.post.post_type?.label || props.post.type || '系统事件')
const resolvedDescription = computed(() => props.post.post_type?.description || '')
const resolvedIcon = computed(() => props.post.post_type?.icon || 'fas fa-info-circle')
const variant = computed(() => {
  if (String(props.post.type || '').toLowerCase().includes('hidden')) {
    return 'alert'
  }
  if (String(props.post.type || '').toLowerCase().includes('sticky')) {
    return 'warm'
  }
  return 'default'
})
</script>

<style scoped>
.generic-event-post-description {
  opacity: 0.82;
}
</style>
