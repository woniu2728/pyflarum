import { computed, watch } from 'vue'
import { getUiCopy } from '../forum/frontendRegistry.js'
import {
  resolveDiscussionListActiveFilterCode,
  resolveDiscussionListPageMetaDescription,
  resolveDiscussionListPageMetaTitle,
} from '../utils/discussionList.js'

export function createDiscussionListMetaState({
  currentTag,
  forumStore,
  isFollowingPage,
  listFilter,
  getText = getUiCopy,
  resolveActiveFilterCode = resolveDiscussionListActiveFilterCode,
  resolveMetaDescription = resolveDiscussionListPageMetaDescription,
  resolveMetaTitle = resolveDiscussionListPageMetaTitle,
  route,
  searchQuery,
}) {
  const activeFilterCode = computed(() => resolveActiveFilterCode({
    isFollowingPage: isFollowingPage.value,
    listFilter: listFilter.value,
  }))

  const pageMetaTitle = computed(() => getText({
    surface: 'discussion-list-page-meta-title',
    listFilter: activeFilterCode.value,
    currentTagName: currentTag.value?.name || '',
    searchQuery: searchQuery.value,
    hasSearchQuery: Boolean(searchQuery.value),
  })?.text || resolveMetaTitle({
    filterCode: activeFilterCode.value,
    currentTagName: currentTag.value?.name || '',
    searchQuery: searchQuery.value,
  }))

  const pageMetaDescription = computed(() => getText({
    surface: 'discussion-list-page-meta-description',
    listFilter: activeFilterCode.value,
    currentTagName: currentTag.value?.name || '',
    currentTagDescription: currentTag.value?.description || '',
    searchQuery: searchQuery.value,
    hasSearchQuery: Boolean(searchQuery.value),
  })?.text || resolveMetaDescription({
    filterCode: activeFilterCode.value,
    currentTagName: currentTag.value?.name || '',
    currentTagDescription: currentTag.value?.description || '',
    searchQuery: searchQuery.value,
  }))

  watch(
    () => [pageMetaTitle.value, pageMetaDescription.value, route.fullPath],
    () => {
      forumStore.setPageMeta({
        title: pageMetaTitle.value,
        description: pageMetaDescription.value,
        canonicalUrl: route.fullPath,
      })
    },
    { immediate: true }
  )

  return {
    activeFilterCode,
    pageMetaDescription,
    pageMetaTitle,
  }
}

export function useDiscussionListMetaState(options) {
  return createDiscussionListMetaState(options)
}
