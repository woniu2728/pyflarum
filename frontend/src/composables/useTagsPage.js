import { computed, onMounted, ref } from 'vue'
import api from '@/api'
import { flattenTags, normalizeTag, unwrapList } from '@/utils/forum'

export function useTagsPage() {
  const tags = ref([])
  const loading = ref(true)

  const cloudTags = computed(() => flattenTags(tags.value.filter(tag => tag.children.length === 0)).slice(0, 12))

  onMounted(async () => {
    await loadTags()
  })

  async function loadTags() {
    loading.value = true
    try {
      const response = await api.get('/tags', {
        params: {
          include_children: true
        }
      })
      tags.value = unwrapList(response).map(normalizeTag)
    } catch (error) {
      console.error('加载标签失败:', error)
    } finally {
      loading.value = false
    }
  }

  return {
    cloudTags,
    loading,
    tags
  }
}
