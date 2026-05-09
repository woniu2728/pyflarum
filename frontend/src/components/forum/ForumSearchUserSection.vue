<template>
  <ForumSearchResultSection
    :title="titleText"
    :show-more="showMore"
    @show-more="$emit('show-more')"
  >
    <ForumSearchResultCard
      v-for="item in userResultItems"
      :key="item.key"
      avatar-mode
      :avatar-url="item.avatarUrl"
      :avatar-alt="item.avatarAlt"
      :avatar-text="item.avatarText"
      :title-html="item.titleHtml"
      :excerpt-html="item.excerptHtml"
      :meta-items="item.metaItems"
      user-layout
      @click="openUser(item.user)"
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

const props = defineProps({
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
const userResultItems = computed(() => props.users.map(user => ({
  key: `user-${user.id}`,
  avatarUrl: user.avatar_url || '',
  avatarAlt: user.username || '',
  avatarText: user.avatar_url ? '' : (user.display_name || user.username || '?').charAt(0).toUpperCase(),
  titleHtml: props.getTitleHtml(user),
  excerptHtml: props.getSubtitleHtml(user),
  metaItems: [
    `@${user.username}`,
    getUiCopy({
      surface: 'search-user-result-discussions',
      count: user.discussion_count || 0,
    })?.text || `${user.discussion_count || 0} 讨论`,
    getUiCopy({
      surface: 'search-user-result-replies',
      count: user.comment_count || 0,
    })?.text || `${user.comment_count || 0} 回复`,
  ],
  user,
})))

function openUser(user) {
  router.push(buildUserPath(user))
}
</script>
