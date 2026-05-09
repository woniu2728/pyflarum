<template>
  <ForumSearchResultSection
    :title="titleText"
    :show-more="showMore"
    @show-more="$emit('show-more')"
  >
    <ForumSearchResultCard
      v-for="discussion in discussions"
      :key="`discussion-${discussion.id}`"
      :avatar-mode="Boolean(discussion.user?.avatar_url)"
      :avatar-url="discussion.user?.avatar_url || ''"
      :avatar-alt="discussion.user?.display_name || discussion.user?.username || ''"
      icon-class="far fa-comments"
      :title-html="getTitleHtml(discussion)"
      :excerpt-html="getExcerptHtml(discussion)"
      :meta-items="[
        discussion.user?.display_name || discussion.user?.username || '未知用户',
        `${discussion.comment_count || 0} 回复`,
        formatRelativeTime(discussion.last_posted_at || discussion.created_at)
      ]"
      @click="openDiscussion(discussion)"
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

defineProps({
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

function openDiscussion(discussion) {
  router.push(buildDiscussionPath(discussion))
}
</script>
