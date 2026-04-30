<template>
  <main class="index-content">
    <DiscussionListHeaderSection
      :auth-store="authStore"
      :current-tag="currentTag"
      :is-following-page="isFollowingPage"
      :sort-by="sortBy"
      :marking-all-read="markingAllRead"
      @change-sort="$emit('change-sort', $event)"
      @mark-all-read="$emit('mark-all-read')"
      @refresh="$emit('refresh')"
    />

    <ForumStateBlock v-if="loading" class="discussion-list-state">
      正在加载讨论...
    </ForumStateBlock>

    <ForumStateBlock v-else-if="discussions.length === 0" class="discussion-list-state">
      {{ emptyStateText }}
    </ForumStateBlock>

    <template v-else>
      <ul class="discussion-list">
        <DiscussionListItem
          v-for="discussion in discussions"
          :key="discussion.id"
          :discussion="discussion"
          :build-discussion-path="buildDiscussionPath"
          :build-tag-path="buildTagPath"
          :build-user-path="buildUserPath"
          :format-relative-time="formatRelativeTime"
          :get-user-avatar-color="getUserAvatarColor"
          :get-user-display-name="getUserDisplayName"
          :get-user-initial="getUserInitial"
        />
      </ul>

      <ForumLoadMoreButton
        v-if="hasMore"
        :loading="loadingMore"
        text="加载更多讨论"
        loading-text="正在加载讨论..."
        @click="$emit('load-more')"
      />
    </template>
  </main>
</template>

<script setup>
import DiscussionListHeaderSection from '@/components/discussion/DiscussionListHeaderSection.vue'
import DiscussionListItem from '@/components/discussion/DiscussionListItem.vue'
import ForumLoadMoreButton from '@/components/forum/ForumLoadMoreButton.vue'
import ForumStateBlock from '@/components/forum/ForumStateBlock.vue'

defineProps({
  authStore: {
    type: Object,
    required: true
  },
  currentTag: {
    type: Object,
    default: null
  },
  isFollowingPage: {
    type: Boolean,
    default: false
  },
  sortBy: {
    type: String,
    default: 'latest'
  },
  markingAllRead: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  },
  discussions: {
    type: Array,
    default: () => []
  },
  emptyStateText: {
    type: String,
    default: '暂无讨论'
  },
  hasMore: {
    type: Boolean,
    default: false
  },
  loadingMore: {
    type: Boolean,
    default: false
  },
  buildDiscussionPath: {
    type: Function,
    required: true
  },
  buildTagPath: {
    type: Function,
    required: true
  },
  buildUserPath: {
    type: Function,
    required: true
  },
  formatRelativeTime: {
    type: Function,
    required: true
  },
  getUserAvatarColor: {
    type: Function,
    required: true
  },
  getUserDisplayName: {
    type: Function,
    required: true
  },
  getUserInitial: {
    type: Function,
    required: true
  }
})

defineEmits(['change-sort', 'mark-all-read', 'refresh', 'load-more'])
</script>

<style scoped>
.index-content {
  flex: 1;
  background: var(--forum-bg-elevated);
}

.discussion-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.discussion-list-state {
  margin: 24px;
}

@media (max-width: 768px) {
  .discussion-list-state {
    margin: 15px;
  }
}
</style>
