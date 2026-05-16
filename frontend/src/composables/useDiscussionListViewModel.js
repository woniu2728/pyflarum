import { computed, watch } from 'vue'
import { getUiCopy } from '@/forum/registry'
import { useDiscussionListPage } from '@/composables/useDiscussionListPage'

export function useDiscussionListViewModel({
  authStore,
  composerStore,
  forumStore,
  modalStore,
  route,
  router,
}) {
  const pageState = useDiscussionListPage({
    authStore,
    composerStore,
    modalStore,
    route,
    router
  })

  const activeFilterCode = computed(() => pageState.isFollowingPage.value ? 'following' : String(pageState.listFilter.value || 'all'))

  const pageMetaTitle = computed(() => getUiCopy({
    surface: 'discussion-list-page-meta-title',
    listFilter: activeFilterCode.value,
    currentTagName: pageState.currentTag.value?.name || '',
    searchQuery: pageState.searchQuery.value,
    hasSearchQuery: Boolean(pageState.searchQuery.value),
  })?.text || resolveDiscussionListPageMetaTitle())

  const pageMetaDescription = computed(() => getUiCopy({
    surface: 'discussion-list-page-meta-description',
    listFilter: activeFilterCode.value,
    currentTagName: pageState.currentTag.value?.name || '',
    currentTagDescription: pageState.currentTag.value?.description || '',
    searchQuery: pageState.searchQuery.value,
    hasSearchQuery: Boolean(pageState.searchQuery.value),
  })?.text || resolveDiscussionListPageMetaDescription())

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

  function resolveDiscussionListPageMetaTitle() {
    const search = String(pageState.searchQuery.value || '').trim()
    const currentTagName = pageState.currentTag.value?.name || ''
    const baseTitle = currentTagName || resolveDiscussionListFilterHeroTitle(activeFilterCode.value)

    return search ? `${baseTitle} - 搜索“${search}”` : baseTitle
  }

  function resolveDiscussionListPageMetaDescription() {
    const search = String(pageState.searchQuery.value || '').trim()
    const currentTagName = pageState.currentTag.value?.name || ''
    const currentTagDescription = String(pageState.currentTag.value?.description || '').trim()

    if (currentTagName) {
      if (search) {
        return `查看标签“${currentTagName}”下与“${search}”相关的讨论。`
      }

      return currentTagDescription || `查看标签“${currentTagName}”下的最新讨论和回复。`
    }

    if (search) {
      return `在${resolveDiscussionListFilterLabel(activeFilterCode.value)}中搜索与“${search}”相关的讨论。`
    }

    switch (activeFilterCode.value) {
      case 'following':
        return '查看你关注的讨论和最新回复。'
      case 'unread':
        return '集中查看你还有未读回复的讨论。'
      case 'my':
        return '集中查看你发起过的讨论与最新互动。'
      default:
        return '浏览论坛最新讨论、热门主题和社区回复。'
    }
  }

  function resolveDiscussionListFilterLabel(filterCode) {
    switch (String(filterCode || 'all').trim()) {
      case 'following':
        return '关注中'
      case 'unread':
        return '未读'
      case 'my':
        return '我的讨论'
      default:
        return '全部讨论'
    }
  }

  function resolveDiscussionListFilterHeroTitle(filterCode) {
    switch (String(filterCode || 'all').trim()) {
      case 'following':
        return '关注的讨论'
      case 'unread':
        return '未读讨论'
      case 'my':
        return '我的讨论'
      default:
        return '全部讨论'
    }
  }

  return {
    ...pageState,
    pageMetaDescription,
    pageMetaTitle,
  }
}
