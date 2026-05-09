<template>
  <ForumSearchResultSection
    :title="titleText"
    :show-more="showMore"
    @show-more="$emit('show-more')"
  >
    <ForumSearchResultCard
      v-for="item in discussionResultItems"
      :key="item.key"
      :avatar-mode="item.avatarMode"
      :avatar-url="item.avatarUrl"
      :avatar-alt="item.avatarAlt"
      icon-class="far fa-comments"
      :title-html="item.titleHtml"
      :excerpt-html="item.excerptHtml"
      :meta-items="item.metaItems"
      @click="openDiscussion(item.discussion)"
    />
  </ForumSearchResultSection>
</template>

<script setup>
import { computed } from 'vue'
import ForumSearchResultCard from '@/components/forum/ForumSearchResultCard.vue'
import ForumSearchResultSection from '@/components/forum/ForumSearchResultSection.vue'
import { getUiCopy } from '@/forum/registry'
import { buildDiscussionPath } from '@/utils/forum'
import { useRouter } from 'vue-router'

const props = defineProps({
  discussions: {
    type: Array,
    default: () => []
  },
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
  showMore: {
    type: Boolean,
    default: false
  }
})

defineEmits(['show-more'])

const router = useRouter()
const titleText = computed(() => getUiCopy({
  surface: 'search-section-discussions-title',
})?.text || '讨论')
const discussionResultItems = computed(() => props.discussions.map(discussion => ({
  key: `discussion-${discussion.id}`,
  avatarMode: Boolean(discussion.user?.avatar_url),
  avatarUrl: discussion.user?.avatar_url || '',
  avatarAlt: discussion.user?.display_name || discussion.user?.username || '',
  titleHtml: props.getTitleHtml(discussion),
  excerptHtml: props.getExcerptHtml(discussion),
  metaItems: [
    discussion.user?.display_name || discussion.user?.username || getUiCopy({
      surface: 'search-result-unknown-user',
    })?.text || '未知用户',
    getUiCopy({
      surface: 'search-discussion-result-replies',
      count: discussion.comment_count || 0,
    })?.text || `${discussion.comment_count || 0} 回复`,
    props.formatRelativeTime(discussion.last_posted_at || discussion.created_at)
  ],
  discussion,
})))

function openDiscussion(discussion) {
  router.push(buildDiscussionPath(discussion))
}
</script>
