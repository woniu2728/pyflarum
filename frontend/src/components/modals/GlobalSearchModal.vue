<template>
  <div ref="root" class="Modal Modal--large Modal--search fade" :class="{ in: showing }" @click.stop>
    <div class="Modal-content SearchModal-content">
      <div class="Modal-close">
        <button
          type="button"
          class="Button Button--icon Button--link"
          :aria-label="closeLabelText"
          @click="modalStore.dismiss()"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="Modal-header SearchModal-header">
        <h3>{{ titleText }}</h3>
        <p>{{ descriptionText }}</p>
      </div>

      <div class="Modal-body SearchModal-body">
        <div class="SearchModal-inputWrap">
          <i class="fas fa-search"></i>
          <input
            ref="inputRef"
            v-model="query"
            type="search"
            class="SearchModal-input"
            :placeholder="inputPlaceholderText"
            @keydown.down.prevent="moveSelection(1)"
            @keydown.up.prevent="moveSelection(-1)"
            @keydown.enter.prevent="submitSelection"
            @keydown.esc.prevent="modalStore.dismiss()"
          />
          <button v-if="normalizedQuery" type="button" class="SearchModal-clear" @click="clearQuery">
            <i class="fas fa-times-circle"></i>
          </button>
        </div>

        <div class="SearchModal-tabs">
          <button
            v-for="tab in tabs"
            :key="tab.value"
            type="button"
            class="SearchModal-tab"
            :class="{ active: activeType === tab.value }"
            @click="activeType = tab.value"
          >
            <span>{{ tab.label }}</span>
            <strong>{{ tab.count }}</strong>
          </button>
        </div>

        <div v-if="!normalizedQuery" class="SearchModal-state">
          <div class="SearchModal-emptyState">
            <p>{{ idleStateText }}</p>
            <div v-if="filterSuggestions.length" class="SearchModal-syntaxPanel">
              <button
                v-for="item in filterSuggestions"
                :key="item.key"
                type="button"
                class="SearchModal-syntaxChip"
                @mousedown.prevent="applyFilterSyntax(item.syntax)"
              >
                <strong>{{ item.syntax }}</strong>
                <span>{{ item.label }}</span>
              </button>
            </div>
          </div>
        </div>
        <div v-else-if="loading" class="SearchModal-state">{{ loadingStateText }}</div>
        <div v-else-if="isEmpty" class="SearchModal-state">
          {{ emptyStateText }}
        </div>
        <div v-else class="SearchModal-results">
          <template v-if="activeType === 'all'">
            <section
              v-for="section in groupedSections"
              :key="section.key"
              class="SearchModal-section"
            >
              <div class="SearchModal-sectionHeader">
                <h4>{{ section.label }}</h4>
                <button type="button" class="SearchModal-sectionLink" @click="activeType = section.key">
                  只看{{ section.label }}
                </button>
              </div>

              <div class="SearchModal-list">
                <button
                  v-for="item in section.items"
                  :key="item.key"
                  type="button"
                  class="SearchModal-result"
                  :class="{ active: activeResultIndex === item.selectIndex }"
                  :data-select-index="item.selectIndex"
                  @mouseenter="activeResultIndex = item.selectIndex"
                  @mousedown.prevent="selectItem(item)"
                >
                  <span class="SearchModal-resultIcon" :class="{ 'SearchModal-resultIcon--avatar': item.avatarUrl }">
                    <img v-if="item.avatarUrl" :src="item.avatarUrl" :alt="item.titleText" />
                    <i v-else :class="item.icon"></i>
                  </span>
                  <span class="SearchModal-resultMain">
                    <span class="SearchModal-resultTitle" v-html="item.titleHtml"></span>
                    <span v-if="item.subtitleHtml" class="SearchModal-resultSubtitle" v-html="item.subtitleHtml"></span>
                    <span v-if="item.metaText" class="SearchModal-resultMeta">{{ item.metaText }}</span>
                  </span>
                </button>
              </div>
            </section>
          </template>

          <div v-else class="SearchModal-list">
            <button
              v-for="item in activeItems"
              :key="item.key"
              type="button"
              class="SearchModal-result"
              :class="{ active: activeResultIndex === item.selectIndex }"
              :data-select-index="item.selectIndex"
              @mouseenter="activeResultIndex = item.selectIndex"
              @mousedown.prevent="selectItem(item)"
            >
              <span class="SearchModal-resultIcon" :class="{ 'SearchModal-resultIcon--avatar': item.avatarUrl }">
                <img v-if="item.avatarUrl" :src="item.avatarUrl" :alt="item.titleText" />
                <i v-else :class="item.icon"></i>
              </span>
              <span class="SearchModal-resultMain">
                <span class="SearchModal-resultTitle" v-html="item.titleHtml"></span>
                <span v-if="item.subtitleHtml" class="SearchModal-resultSubtitle" v-html="item.subtitleHtml"></span>
                <span v-if="item.metaText" class="SearchModal-resultMeta">{{ item.metaText }}</span>
              </span>
            </button>
          </div>

          <div class="SearchModal-footer">
            <button
              type="button"
              class="SearchModal-fullPage"
              :class="{ active: activeResultIndex === fullPageActionIndex }"
              :data-select-index="fullPageActionIndex"
              @mouseenter="activeResultIndex = fullPageActionIndex"
              @mousedown.prevent="openFullResults"
            >
              {{ fullResultsText }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useSearchFilterCatalog } from '@/composables/useSearchFilterCatalog'
import { getEmptyState, getSearchSources, getStateBlock, getUiCopy } from '@/forum/registry'
import { useModalStore } from '@/stores/modal'
import { useResourceStore } from '@/stores/resource'
import api from '@/api'
import {
  normalizeDiscussion,
  normalizePost,
  normalizeUser,
  unwrapList
} from '@/utils/forum'

const props = defineProps({
  showing: {
    type: Boolean,
    default: false
  },
  initialQuery: {
    type: String,
    default: ''
  },
  initialType: {
    type: String,
    default: 'all'
  }
})

const router = useRouter()
const modalStore = useModalStore()
const resourceStore = useResourceStore()
const searchSources = getSearchSources()
const searchSourceMap = Object.fromEntries(searchSources.map(item => [item.type, item]))
const root = ref(null)
const inputRef = ref(null)
const query = ref(String(props.initialQuery || ''))
const allowedTypes = ['all', ...searchSources.map(item => item.type)]
const activeType = ref(allowedTypes.includes(props.initialType) ? props.initialType : 'all')
const searchFilterTarget = computed(() => {
  if (activeType.value === 'all') return 'all'
  return searchSourceMap[activeType.value]?.filterTarget || ''
})
const searchFilterCatalog = useSearchFilterCatalog(searchFilterTarget)
const loading = ref(false)
const discussionIds = ref([])
const postIds = ref([])
const userIds = ref([])
const totals = ref({
  discussions: 0,
  posts: 0,
  users: 0,
})
const activeResultIndex = ref(-1)
let searchTimer = null
let requestId = 0

const normalizedQuery = computed(() => query.value.trim())
const searchResults = computed(() => ({
  discussions: resourceStore.list('discussions', discussionIds.value),
  posts: resourceStore.list('posts', postIds.value),
  users: resourceStore.list('users', userIds.value),
}))
const tabs = computed(() => [
  { value: 'all', label: '全部', count: totals.value.discussions + totals.value.posts + totals.value.users },
  ...searchSources.map(item => ({
    value: item.type,
    label: item.label,
    count: Number(totals.value[item.type] || 0),
  })),
])
const activeTabLabel = computed(() => tabs.value.find(tab => tab.value === activeType.value)?.label || '全部')
const closeLabelText = computed(() => getUiCopy({
  surface: 'search-modal-close-label',
})?.text || '关闭搜索')
const titleText = computed(() => getUiCopy({
  surface: 'search-modal-title',
})?.text || '搜索')
const descriptionText = computed(() => getUiCopy({
  surface: 'search-modal-description',
})?.text || '按讨论、帖子、用户快速定位内容，交互参考 Flarum 的全局搜索流程。')
const inputPlaceholderText = computed(() => getUiCopy({
  surface: 'search-modal-input-placeholder',
})?.text || '输入关键词搜索讨论、帖子和用户')
const fullResultsText = computed(() => getUiCopy({
  surface: 'search-modal-full-results',
  activeTabLabel: activeTabLabel.value,
})?.text || `查看${activeTabLabel.value}完整结果`)
const modalSourceSections = computed(() => {
  const sourceItems = {
    discussions: searchResults.value.discussions,
    posts: searchResults.value.posts,
    users: searchResults.value.users,
  }

  return searchSources.map(source => {
    const sourceKey = source.type
    const items = sourceItems[sourceKey] || []
    const resultItems = typeof source.buildResultItems === 'function'
      ? source.buildResultItems(items, { query: normalizedQuery.value })
      : []

    return {
      ...source,
      key: sourceKey,
      items: resultItems,
    }
  })
})

const groupedSections = computed(() => {
  let selectIndex = 0

  return modalSourceSections.value
    .filter(section => section.items.length)
    .map(section => ({
      ...section,
      items: section.items.map(item => ({
        ...item,
        selectIndex: selectIndex++,
      }))
    }))
})

const activeItems = computed(() => {
  const activeSection = modalSourceSections.value.find(section => section.key === activeType.value)
  const items = activeSection?.items || []
  return items.map((item, index) => ({
    ...item,
    selectIndex: index,
  }))
})

const visibleSelectableItems = computed(() => {
  if (activeType.value === 'all') {
    return groupedSections.value.flatMap(section => section.items)
  }
  return activeItems.value
})

const fullPageActionIndex = computed(() => visibleSelectableItems.value.length)
const isEmpty = computed(() => modalSourceSections.value.every(section => section.items.length === 0))
const idleStateText = computed(() => {
  const emptyState = getEmptyState({
    surface: 'search-modal-idle',
    hasQuery: Boolean(normalizedQuery.value),
    searchType: activeType.value,
  })

  return emptyState?.text || '输入关键词后即可开始搜索。你可以直接回车进入完整搜索结果页。'
})
const emptyStateText = computed(() => {
  const emptyState = getEmptyState({
    surface: 'search-modal-empty',
    hasQuery: Boolean(normalizedQuery.value),
    searchType: activeType.value,
  })

  return emptyState?.text || '没有找到相关结果，试试更短的关键词或切换分类。'
})
const loadingStateText = computed(() => {
  const stateBlock = getStateBlock({
    surface: 'search-modal-loading',
    loading: loading.value,
    hasQuery: Boolean(normalizedQuery.value),
    searchType: activeType.value,
  })

  return stateBlock?.text || '搜索中...'
})
const filterSuggestions = computed(() => {
  if (!searchFilterTarget.value || activeType.value === 'all') {
    return []
  }
  return searchFilterCatalog.filterSuggestions.value
})

watch(
  () => props.showing,
  showing => {
    if (!showing) return

    nextTick(() => {
      inputRef.value?.focus()
      inputRef.value?.select?.()
    })
  },
  { immediate: true }
)

watch(
  () => [normalizedQuery.value, activeType.value],
  () => {
    activeResultIndex.value = -1

    if (searchTimer) {
      clearTimeout(searchTimer)
      searchTimer = null
    }

    if (!normalizedQuery.value) {
      loading.value = false
      discussionIds.value = []
      postIds.value = []
      userIds.value = []
      totals.value = { discussions: 0, posts: 0, users: 0 }
      return
    }

    loading.value = true
    searchTimer = setTimeout(() => {
      fetchResults()
    }, 180)
  },
  { immediate: true }
)

watch(
  () => visibleSelectableItems.value.length,
  count => {
    if (!normalizedQuery.value) {
      activeResultIndex.value = -1
      return
    }

    if (count >= 0 && activeResultIndex.value < 0) {
      activeResultIndex.value = 0
    }

    if (activeResultIndex.value > count) {
      activeResultIndex.value = count
    }

    nextTick(() => {
      scrollActiveOptionIntoView()
    })
  }
)

onMounted(() => {
  nextTick(() => {
    inputRef.value?.focus()
    inputRef.value?.select?.()
  })
})

onBeforeUnmount(() => {
  if (searchTimer) {
    clearTimeout(searchTimer)
    searchTimer = null
  }
})

async function fetchResults() {
  const currentRequestId = ++requestId

  try {
      const data = await api.get('/search', {
        params: {
          q: normalizedQuery.value,
          type: searchSourceMap[activeType.value]?.apiType || activeType.value,
          limit: activeType.value === 'all' ? 4 : 8,
        }
      })

    if (currentRequestId !== requestId) return

    totals.value = {
      discussions: data.discussion_total ?? 0,
      posts: data.post_total ?? 0,
      users: data.user_total ?? 0,
    }
    discussionIds.value = unwrapList(data.discussions || [])
      .map(normalizeDiscussion)
      .map(item => resourceStore.upsert('discussions', item).id)
    postIds.value = unwrapList(data.posts || [])
      .map(normalizePost)
      .map(item => resourceStore.upsert('posts', item).id)
    userIds.value = unwrapList(data.users || [])
      .map(normalizeUser)
      .map(item => resourceStore.upsert('users', item).id)
  } catch (error) {
    if (currentRequestId !== requestId) return

    console.error('加载搜索结果失败:', error)
    discussionIds.value = []
    postIds.value = []
    userIds.value = []
    totals.value = { discussions: 0, posts: 0, users: 0 }
  } finally {
    if (currentRequestId === requestId) {
      loading.value = false
    }
  }
}

function clearQuery() {
  query.value = ''
  nextTick(() => {
    inputRef.value?.focus()
  })
}

function applyFilterSyntax(syntax) {
  query.value = searchFilterCatalog.appendFilter(normalizedQuery.value, syntax)
  nextTick(() => {
    inputRef.value?.focus()
  })
}

function moveSelection(direction) {
  const maxIndex = fullPageActionIndex.value
  if (maxIndex < 0) return

  const nextIndex = activeResultIndex.value + direction
  if (nextIndex < 0) {
    activeResultIndex.value = maxIndex
  } else if (nextIndex > maxIndex) {
    activeResultIndex.value = 0
  } else {
    activeResultIndex.value = nextIndex
  }

  nextTick(() => {
    scrollActiveOptionIntoView()
  })
}

function submitSelection() {
  if (!normalizedQuery.value) return

  if (activeResultIndex.value === fullPageActionIndex.value) {
    openFullResults()
    return
  }

  const item = visibleSelectableItems.value[activeResultIndex.value]
  if (item) {
    selectItem(item)
    return
  }

  openFullResults()
}

function selectItem(item) {
  modalStore.dismiss()
  router.push(item.path)
}

function openFullResults() {
  if (!normalizedQuery.value) return

  modalStore.dismiss()
  router.push({
    path: '/search',
    query: {
      q: normalizedQuery.value,
      ...(activeType.value === 'all' ? {} : { type: activeType.value }),
    }
  })
}

function scrollActiveOptionIntoView() {
  const currentIndex = activeResultIndex.value
  if (currentIndex < 0) return

  const activeNode = root.value?.querySelector(`[data-select-index="${currentIndex}"]`)
  activeNode?.scrollIntoView?.({ block: 'nearest' })
}
</script>

<style scoped>
.SearchModal-content {
  min-height: min(78vh, 760px);
}

.SearchModal-header {
  padding-bottom: 16px;
  text-align: left;
}

.SearchModal-header h3 {
  margin-bottom: 8px;
}

.SearchModal-header p {
  margin: 0;
  color: #6f7f8f;
  line-height: 1.6;
}

.SearchModal-body {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding-top: 0;
}

.SearchModal-inputWrap {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 14px;
  min-height: 52px;
  border: 1px solid #d9e3eb;
  border-radius: 14px;
  background: #fff;
  box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.04);
}

.SearchModal-inputWrap:focus-within {
  border-color: #4d698e;
  box-shadow: 0 0 0 4px rgba(77, 105, 142, 0.12);
}

.SearchModal-inputWrap > i {
  color: #7b8794;
  font-size: 15px;
}

.SearchModal-input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: none;
  background: transparent;
  font-size: 16px;
  color: #22303d;
}

.SearchModal-clear {
  border: 0;
  background: transparent;
  color: #8a96a2;
  width: 28px;
  height: 28px;
  border-radius: 50%;
}

.SearchModal-clear:hover {
  background: #eef2f6;
  color: #5c6d7e;
}

.SearchModal-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.SearchModal-tab {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 38px;
  padding: 0 14px;
  border: 1px solid #d8e1e8;
  border-radius: 999px;
  background: #fff;
  color: #536476;
  font-weight: 600;
}

.SearchModal-tab strong {
  min-width: 22px;
  padding: 0 7px;
  border-radius: 999px;
  background: #eef3f7;
  color: #4d698e;
  font-size: 12px;
  line-height: 22px;
}

.SearchModal-tab.active {
  border-color: #4d698e;
  background: #edf3f9;
  color: #31465b;
}

.SearchModal-state {
  min-height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed #d8e1e8;
  border-radius: 14px;
  background: #fafcfd;
  color: #7a8794;
  text-align: center;
  line-height: 1.7;
  padding: 24px;
}

.SearchModal-emptyState {
  display: flex;
  flex-direction: column;
  gap: 18px;
  align-items: center;
}

.SearchModal-emptyState p {
  margin: 0;
}

.SearchModal-syntaxPanel {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
}

.SearchModal-syntaxChip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 34px;
  padding: 0 12px;
  border: 1px solid #d8e1e8;
  border-radius: 999px;
  background: #fff;
  color: #4f6478;
  font-size: 12px;
  font-weight: 600;
}

.SearchModal-syntaxChip strong {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  color: #31465b;
}

.SearchModal-syntaxChip:hover {
  border-color: #4d698e;
  background: #edf3f9;
}

.SearchModal-results {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.SearchModal-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.SearchModal-sectionHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.SearchModal-sectionHeader h4 {
  margin: 0;
  color: #22303d;
  font-size: 16px;
}

.SearchModal-sectionLink {
  border: 0;
  background: transparent;
  color: #4d698e;
  font-size: 13px;
  font-weight: 700;
}

.SearchModal-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.SearchModal-result {
  width: 100%;
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 14px 15px;
  border: 1px solid #e2e8ee;
  border-radius: 12px;
  background: #fff;
  text-align: left;
  color: #34485c;
}

.SearchModal-result:hover,
.SearchModal-result.active {
  border-color: #4d698e;
  background: #f7fafd;
  box-shadow: 0 10px 24px rgba(49, 70, 91, 0.08);
}

.SearchModal-resultIcon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #eef3f7;
  color: #5f7388;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}

.SearchModal-resultIcon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.SearchModal-resultMain {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.SearchModal-resultTitle,
.SearchModal-resultSubtitle {
  line-height: 1.5;
}

.SearchModal-resultTitle {
  color: #22303d;
  font-size: 15px;
  font-weight: 700;
}

.SearchModal-resultSubtitle {
  color: #617282;
  font-size: 13px;
}

.SearchModal-resultMeta {
  color: #8b97a3;
  font-size: 12px;
}

.SearchModal-resultTitle :deep(mark),
.SearchModal-resultSubtitle :deep(mark) {
  background: rgba(255, 220, 126, 0.55);
  color: inherit;
  padding: 0 2px;
  border-radius: 4px;
}

.SearchModal-footer {
  padding-top: 4px;
}

.SearchModal-fullPage {
  width: 100%;
  min-height: 44px;
  border: 1px dashed #c6d2de;
  border-radius: 12px;
  background: #fafcfd;
  color: #4d698e;
  font-weight: 700;
}

.SearchModal-fullPage:hover,
.SearchModal-fullPage.active {
  border-color: #4d698e;
  background: #edf3f9;
}

@media (max-width: 768px) {
  .SearchModal-content {
    min-height: 100dvh;
  }

  .SearchModal-header {
    padding-bottom: 12px;
  }

  .SearchModal-body {
    gap: 16px;
  }

  .SearchModal-input {
    font-size: 15px;
  }

  .SearchModal-tabs {
    gap: 8px;
  }

  .SearchModal-tab {
    flex: 1 1 calc(50% - 4px);
    justify-content: space-between;
  }
}
</style>
