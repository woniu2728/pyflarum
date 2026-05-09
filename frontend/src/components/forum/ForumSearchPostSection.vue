<template>
  <ForumSearchResultSection
    :title="titleText"
    :show-more="showMore"
    @show-more="$emit('show-more')"
  >
    <ForumSearchResultCard
      v-for="item in postResultItems"
      :key="item.key"
      :avatar-mode="item.avatarMode"
      :avatar-url="item.avatarUrl"
      :avatar-alt="item.avatarAlt"
      icon-class="far fa-comment"
      :title-html="item.titleHtml"
      :excerpt-html="item.excerptHtml"
      :meta-items="item.metaItems"
      @click="openPost(item.post)"
    />
  </ForumSearchResultSection>
</template>

<script setup>
import { computed } from 'vue'
import ForumSearchResultCard from '@/components/forum/ForumSearchResultCard.vue'
import ForumSearchResultSection from '@/components/forum/ForumSearchResultSection.vue'
import { getUiCopy } from '@/forum/registry'
import { useRouter } from 'vue-router'

const props = defineProps({
  formatRelativeTime: {
    type: Function,
    required: true
  },
  getExcerptHtml: {
    type: Function,
    required: true
  },
  getTitleHtml: {
    type: Function,
    required: true
  },
  posts: {
    type: Array,
    default: () => []
  },
  showMore: {
    type: Boolean,
    default: false
  }
})

defineEmits(['show-more'])

const router = useRouter()
const titleText = computed(() => getUiCopy({
  surface: 'search-section-posts-title',
})?.text || '帖子')
const postResultItems = computed(() => props.posts.map(post => ({
  key: `post-${post.id}`,
  avatarMode: Boolean(post.user?.avatar_url),
  avatarUrl: post.user?.avatar_url || '',
  avatarAlt: post.user?.display_name || post.user?.username || '',
  titleHtml: props.getTitleHtml(post),
  excerptHtml: props.getExcerptHtml(post),
  metaItems: [
    `#${post.number}`,
    post.user?.display_name || post.user?.username || getUiCopy({
      surface: 'search-result-unknown-user',
    })?.text || '未知用户',
    props.formatRelativeTime(post.created_at)
  ],
  post,
})))

function openPost(post) {
  router.push(`/d/${post.discussion_id}?near=${post.number}`)
}
</script>
