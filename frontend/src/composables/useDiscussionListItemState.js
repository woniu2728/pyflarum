import { computed } from 'vue'
import { getDiscussionBadges } from '../forum/frontendRegistry.js'

export function createDiscussionListItemState({
  discussion,
  getBadges = getDiscussionBadges,
}) {
  const discussionBadges = computed(() => getBadges({
    discussion: discussion.value,
    surface: 'discussion-list-item',
  }))

  return {
    discussionBadges,
  }
}

export function useDiscussionListItemState(options) {
  return createDiscussionListItemState(options)
}
