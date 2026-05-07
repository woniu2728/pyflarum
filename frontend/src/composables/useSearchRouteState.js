import { useRouteListState } from '@/composables/useRouteListState'
import { getSearchSources } from '@/forum/registry'

function normalizePage(value) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1
}

function normalizeSearchType(value) {
  const normalized = String(value || 'all').trim()
  const allowedTypes = ['all', ...getSearchSources().map(item => item.routeType || item.type)]
  return allowedTypes.includes(normalized) ? normalized : 'all'
}

export function useSearchRouteState({ route, router }) {
  return useRouteListState({
    route,
    router,
    resolveTarget: () => ({
      path: '/search',
    }),
    schema: {
      normalizedQuery: {
        queryKey: 'q',
        defaultValue: '',
        normalize: value => String(value || '').trim(),
      },
      searchType: {
        queryKey: 'type',
        defaultValue: 'all',
        normalize: normalizeSearchType,
        omitWhen: value => value === 'all',
      },
      page: {
        defaultValue: 1,
        normalize: normalizePage,
        serialize: value => String(value),
        omitWhen: value => value <= 1,
      },
    },
  })
}
