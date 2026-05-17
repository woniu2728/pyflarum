import { computed } from 'vue'
import { getUiCopy } from '../forum/frontendRegistry.js'
import {
  getDiscussionListFilterHeroDescriptionText,
  getDiscussionListFilterHeroTitleText,
  getDiscussionListFilterLabelText,
  resolveDiscussionListActiveFilterCode,
} from '../utils/discussionList.js'

function resolveDiscussionListFilterHeroIcon(filterCode) {
  switch (String(filterCode || 'all').trim()) {
    case 'unread':
      return 'fas fa-inbox'
    case 'my':
      return 'fas fa-user-pen'
    default:
      return 'fas fa-bell'
  }
}

export function createDiscussionListHeroState({
  currentTag,
  getActiveFilterCode = resolveDiscussionListActiveFilterCode,
  getFilterHeroDescriptionText = getDiscussionListFilterHeroDescriptionText,
  getFilterHeroTitleText = getDiscussionListFilterHeroTitleText,
  getFilterLabelText = getDiscussionListFilterLabelText,
  getText = getUiCopy,
  isFollowingPage,
  listFilter,
}) {
  const activeFilterCode = computed(() => getActiveFilterCode({
    isFollowingPage: isFollowingPage.value,
    listFilter: listFilter.value,
  }))

  const showFilterHero = computed(() => !currentTag.value && activeFilterCode.value !== 'all')

  const filterHeroPillText = computed(() => getText({
    surface: 'discussion-list-filter-hero-pill',
    listFilter: activeFilterCode.value,
  })?.text || getFilterLabelText(activeFilterCode.value))

  const filterHeroTitleText = computed(() => getText({
    surface: 'discussion-list-filter-hero-title',
    listFilter: activeFilterCode.value,
  })?.text || getFilterHeroTitleText(activeFilterCode.value))

  const filterHeroDescriptionText = computed(() => getText({
    surface: 'discussion-list-filter-hero-description',
    listFilter: activeFilterCode.value,
  })?.text || getFilterHeroDescriptionText(activeFilterCode.value))

  const filterHeroIcon = computed(() => resolveDiscussionListFilterHeroIcon(activeFilterCode.value))

  const currentTagDescriptionText = computed(() => getText({
    surface: 'discussion-list-tag-hero-description',
    tagName: currentTag.value?.name || '',
  })?.text || '这个标签下的讨论会集中显示在这里。')

  return {
    activeFilterCode,
    currentTagDescriptionText,
    filterHeroDescriptionText,
    filterHeroIcon,
    filterHeroPillText,
    filterHeroTitleText,
    showFilterHero,
  }
}

export function useDiscussionListHeroState(options) {
  return createDiscussionListHeroState(options)
}
