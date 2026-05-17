import { computed } from 'vue'
import { getUiCopy } from '../forum/frontendRegistry.js'

export function createDiscussionListSidebarStartButtonState({
  currentTag,
  getText = getUiCopy,
}) {
  const labelText = computed(() => getText({
    surface: 'start-discussion-button',
    hasTag: Boolean(currentTag.value),
    tagName: currentTag.value?.name || '',
  })?.text || '发起讨论')

  return {
    labelText,
  }
}

export function useDiscussionListSidebarStartButtonState(options) {
  return createDiscussionListSidebarStartButtonState(options)
}
