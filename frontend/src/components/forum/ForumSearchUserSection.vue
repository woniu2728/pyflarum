<template>
  <ForumSearchResultSection
    :title="titleText"
    :show-more="showMore"
    @show-more="$emit('show-more')"
  >
    <ForumSearchResultCard
      v-for="user in users"
      :key="`user-${user.id}`"
      avatar-mode
      :avatar-url="user.avatar_url || ''"
      :avatar-alt="user.username || ''"
      :avatar-text="user.avatar_url ? '' : (user.display_name || user.username || '?').charAt(0).toUpperCase()"
      :title-html="getTitleHtml(user)"
      :excerpt-html="getSubtitleHtml(user)"
      :meta-items="[
        `@${user.username}`,
        `${user.discussion_count || 0} 讨论`,
        `${user.comment_count || 0} 回复`
      ]"
      user-layout
      @click="openUser(user)"
    />
  </ForumSearchResultSection>
</template>

<script setup>
import { computed } from 'vue'
import ForumSearchResultCard from '@/components/forum/ForumSearchResultCard.vue'
import ForumSearchResultSection from '@/components/forum/ForumSearchResultSection.vue'
import { getUiCopy } from '@/forum/registry'
import { buildUserPath } from '@/utils/forum'
import { useRouter } from 'vue-router'

defineProps({
  getSubtitleHtml: {
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
  },
  users: {
    type: Array,
    default: () => []
  }
})

defineEmits(['show-more'])

const router = useRouter()
const titleText = computed(() => getUiCopy({
  surface: 'search-section-users-title',
})?.text || '用户')

function openUser(user) {
  router.push(buildUserPath(user))
}
</script>
