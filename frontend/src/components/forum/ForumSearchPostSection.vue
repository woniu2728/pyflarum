<template>
  <ForumSearchResultSection
    title="帖子"
    :show-more="showMore"
    @show-more="$emit('show-more')"
  >
    <ForumSearchResultCard
      v-for="post in posts"
      :key="`post-${post.id}`"
      :avatar-mode="Boolean(post.user?.avatar_url)"
      :avatar-url="post.user?.avatar_url || ''"
      :avatar-alt="post.user?.display_name || post.user?.username || ''"
      icon-class="far fa-comment"
      :title-html="getTitleHtml(post)"
      :excerpt-html="getExcerptHtml(post)"
      :meta-items="[
        `#${post.number}`,
        post.user?.display_name || post.user?.username || '未知用户',
        formatRelativeTime(post.created_at)
      ]"
      @click="openPost(post)"
    />
  </ForumSearchResultSection>
</template>

<script setup>
import ForumSearchResultCard from '@/components/forum/ForumSearchResultCard.vue'
import ForumSearchResultSection from '@/components/forum/ForumSearchResultSection.vue'
import { useRouter } from 'vue-router'

defineProps({
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

function openPost(post) {
  router.push(`/d/${post.discussion_id}?near=${post.number}`)
}
</script>
