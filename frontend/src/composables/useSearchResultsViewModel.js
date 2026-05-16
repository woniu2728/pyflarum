import { computed, watch } from 'vue'
import { getUiCopy } from '@/forum/registry'
import { useSearchResultsPage } from '@/composables/useSearchResultsPage'
import { resolveSearchMetaPayload } from '@/utils/searchMeta'

export function useSearchResultsViewModel({
  forumStore,
  pageState: injectedPageState,
  route,
  router,
}) {
  const pageState = injectedPageState || useSearchResultsPage({
    route,
    router,
  })

  const visibleSearchSections = computed(() => {
    return pageState.searchSourceSections.value.filter(section => section.visible && section.resultItems.length)
  })

  const heroPillText = computed(() => {
    return getUiCopy({
      surface: 'search-page-hero-pill',
    })?.text || '全局搜索'
  })

  const heroTitleText = computed(() => {
    return getUiCopy({
      surface: 'search-page-hero-title',
      query: pageState.normalizedQuery.value,
    })?.text || `“${pageState.normalizedQuery.value || '未输入关键词'}”`
  })

  const searchStatsItems = computed(() => [
    {
      key: 'discussions',
      label: getUiCopy({
        surface: 'search-page-stats-label',
        itemKey: 'discussions',
        count: pageState.discussionTotal.value,
      })?.text || '讨论',
      count: pageState.discussionTotal.value,
    },
    {
      key: 'posts',
      label: getUiCopy({
        surface: 'search-page-stats-label',
        itemKey: 'posts',
        count: pageState.postTotal.value,
      })?.text || '帖子',
      count: pageState.postTotal.value,
    },
    {
      key: 'users',
      label: getUiCopy({
        surface: 'search-page-stats-label',
        itemKey: 'users',
        count: pageState.userTotal.value,
      })?.text || '用户',
      count: pageState.userTotal.value,
    },
  ])

  watch(
    () => [
      pageState.normalizedQuery.value,
      pageState.searchType.value,
      pageState.discussionTotal.value,
      pageState.postTotal.value,
      pageState.userTotal.value,
    ],
    () => {
      const query = pageState.normalizedQuery.value
      const title = getUiCopy({
        surface: 'search-page-meta-title',
        query,
      })?.text || ''
      const description = getUiCopy({
        surface: 'search-page-meta-description',
        query,
        hasQuery: Boolean(query),
      })?.text || ''

      forumStore.setPageMeta(resolveSearchMetaPayload({
        query,
        searchType: pageState.searchType.value,
        titleText: title,
        descriptionText: description,
      }))
    },
    { immediate: true }
  )

  return {
    ...pageState,
    heroPillText,
    heroTitleText,
    searchStatsItems,
    visibleSearchSections,
  }
}
