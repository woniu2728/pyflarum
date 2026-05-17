import { computed } from 'vue'

export function createDiscussionCreateViewBindings({
  descriptionText,
  titleText,
}) {
  const cardBindings = computed(() => ({
    title: titleText.value,
    description: descriptionText.value,
  }))

  return {
    cardBindings,
  }
}

export function useDiscussionCreateViewBindings(options) {
  return createDiscussionCreateViewBindings(options)
}
