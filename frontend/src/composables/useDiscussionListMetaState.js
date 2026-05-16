import { computed, watch } from 'vue'
import { getUiCopy } from '@/forum/registry'
import {
  resolveDiscussionListActiveFilterCode,
  resolveDiscussionListPageMetaDescription,
  resolveDiscussionListPageMetaTitle,
} from '@/utils/forum'

export function useDiscussionListMetaState({
  currentTag,
  forumStore,
  isFollowingPage,
  listFilter,
  route,
  searchQuery,
}) {
  const activeFilterCode = computed(() => resolveDiscussionListActiveFilterCode({
    isFollowingPage: isFollowingPage.value,
    listFilter: listFilter.value,
  }))

  const pageMetaTitle = computed(() => getUiCopy({
    surface: 'discussion-list-page-meta-title',
    listFilter: activeFilterCode.value,
    currentTagName: currentTag.value?.name || '',
    searchQuery: searchQuery.value,
    hasSearchQuery: Boolean(searchQuery.value),
  })?.text || resolveDiscussionListPageMetaTitle({
    filterCode: activeFilterCode.value,
    currentTagName: currentTag.value?.name || '',
    searchQuery: searchQuery.value,
  }))

  const pageMetaDescription = computed(() => getUiCopy({
    surface: 'discussion-list-page-meta-description',
    listFilter: activeFilterCode.value,
    currentTagName: currentTag.value?.name || '',
    currentTagDescription: currentTag.value?.description || '',
    searchQuery: searchQuery.value,
    hasSearchQuery: Boolean(searchQuery.value),
  })?.text || resolveDiscussionListPageMetaDescription({
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
