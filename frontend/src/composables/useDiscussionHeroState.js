import { computed } from 'vue'
import { getDiscussionReviewBanner, getHeroMetaItems } from '../forum/frontendRegistry.js'

export function createDiscussionHeroState({
  canEditDiscussion,
  canModeratePendingDiscussion,
  discussion,
  getHeroMeta = getHeroMetaItems,
  getReviewBanner = getDiscussionReviewBanner,
}) {
  const discussionReviewBanner = computed(() => getReviewBanner({
    discussion: discussion.value,
    canModeratePendingDiscussion: canModeratePendingDiscussion.value,
    canEditDiscussion: canEditDiscussion.value,
    surface: 'discussion-hero',
  }))

  const heroMetaItems = computed(() => getHeroMeta({
    discussion: discussion.value,
    surface: 'discussion-hero',
  }))

  return {
    discussionReviewBanner,
    heroMetaItems,
  }
}

export function useDiscussionHeroState(options) {
  return createDiscussionHeroState(options)
}
