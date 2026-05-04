<template>
  <DiscussionEventPostBase
    :post="post"
    :is-target="isTarget"
    :icon="isLocked ? 'fas fa-lock' : 'fas fa-lock-open'"
    :variant="isLocked ? 'alert' : 'default'"
    :format-absolute-date="formatAbsoluteDate"
    :format-date="formatDate"
    @jump-to-post="$emit('jump-to-post', $event)"
  >
    <template #line>
      <strong>{{ actorName }}</strong>
      <span>{{ isLocked ? '锁定了该讨论' : '解锁了该讨论' }}</span>
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
const isLocked = computed(() => Boolean(props.post.event_data?.is_locked))
</script>
