import { computed, ref, watch } from 'vue'
import {
  buildSearchFilterQuery,
  buildSearchFilterSuggestions,
  ensureSearchFilterCatalogLoaded,
} from '@/forum/searchFilters'

function resolveTargetValue(target) {
  return typeof target === 'function' ? target() : target?.value ?? target
}

export function useSearchFilterCatalog(target = '') {
  const loading = ref(false)
  const loadError = ref('')
  const ready = ref(false)
  const activeTarget = computed(() => String(resolveTargetValue(target) || '').trim())

  const filterSuggestions = computed(() => buildSearchFilterSuggestions(activeTarget.value))

  watch(
    activeTarget,
    async nextTarget => {
      if (loading.value) return

      loading.value = true
      loadError.value = ''
      try {
        await ensureSearchFilterCatalogLoaded(nextTarget || 'all')
        ready.value = true
      } catch (error) {
        console.error('加载搜索过滤目录失败:', error)
        loadError.value = error.response?.data?.error || error.message || '加载搜索过滤目录失败'
      } finally {
        loading.value = false
      }
    }
    ,
    { immediate: true }
  )

  function appendFilter(baseQuery, syntax) {
    return buildSearchFilterQuery(baseQuery, syntax)
  }

  return {
    appendFilter,
    filterSuggestions,
    loadError,
    loading,
    ready,
  }
}
