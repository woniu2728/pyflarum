import { computed, watch } from 'vue'
import { getUiCopy } from '@/forum/registry'
import { useDiscussionListPage } from '@/composables/useDiscussionListPage'
import {
  resolveDiscussionListActiveFilterCode,
  resolveDiscussionListPageMetaDescription,
  resolveDiscussionListPageMetaTitle,
} from '@/utils/forum'

export function useDiscussionListViewModel({
  authStore,
  composerStore,
  forumStore,
  modalStore,
  pageState: injectedPageState,
  route,
  router,
}) {
  const pageState = injectedPageState || useDiscussionListPage({
    authStore,
    composerStore,
    modalStore,
    route,
    router
  })

  const activeFilterCode = computed(() => resolveDiscussionListActiveFilterCode({
    isFollowingPage: pageState.isFollowingPage.value,
    listFilter: pageState.listFilter.value,
  }))

  const pageMetaTitle = computed(() => getUiCopy({
    surface: 'discussion-list-page-meta-title',
    listFilter: activeFilterCode.value,
    currentTagName: pageState.currentTag.value?.name || '',
    searchQuery: pageState.searchQuery.value,
    hasSearchQuery: Boolean(pageState.searchQuery.value),
  })?.text || resolveDiscussionListPageMetaTitle({
    filterCode: activeFilterCode.value,
    currentTagName: pageState.currentTag.value?.name || '',
    searchQuery: pageState.searchQuery.value,
  }))

  const pageMetaDescription = computed(() => getUiCopy({
    surface: 'discussion-list-page-meta-description',
    listFilter: activeFilterCode.value,
    currentTagName: pageState.currentTag.value?.name || '',
    currentTagDescription: pageState.currentTag.value?.description || '',
    searchQuery: pageState.searchQuery.value,
    hasSearchQuery: Boolean(pageState.searchQuery.value),
  })?.text || resolveDiscussionListPageMetaDescription({
    filterCode: activeFilterCode.value,
    currentTagName: pageState.currentTag.value?.name || '',
    currentTagDescription: pageState.currentTag.value?.description || '',
    searchQuery: pageState.searchQuery.value,
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
    ...pageState,
    pageMetaDescription,
    pageMetaTitle,
  }
}
