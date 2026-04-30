<template>
  <div class="content-section">
    <ForumStateBlock v-if="loading" class="section-state-block">加载中...</ForumStateBlock>
    <ForumStateBlock v-else-if="posts.length === 0" class="section-state-block">
      {{ isOwnProfile ? '你还没有发表过回复' : '该用户还没有发表过回复' }}
    </ForumStateBlock>
    <div v-else class="post-list">
      <div v-for="post in posts" :key="post.id" class="post-item">
        <div class="post-header">
          <div class="post-header-main">
            <router-link
              :to="buildDiscussionPath(post.discussion?.id || post.discussion_id)"
              class="post-discussion-link"
            >
              <i class="fas fa-arrow-right"></i>
              {{ post.discussion?.title || '讨论' }}
            </router-link>
            <span v-if="post.approval_status === 'pending'" class="approval-pill">待审核</span>
            <span v-else-if="post.approval_status === 'rejected'" class="approval-pill approval-pill--rejected">已拒绝</span>
          </div>
          <span class="post-time">{{ formatDate(post.created_at) }}</span>
        </div>
        <p v-if="post.approval_status === 'rejected' && post.approval_note" class="approval-note">
          审核反馈：{{ post.approval_note }}
        </p>
        <div class="post-content" v-html="post.content_html || post.content"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import ForumStateBlock from '@/components/forum/ForumStateBlock.vue'

defineProps({
  posts: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  isOwnProfile: {
    type: Boolean,
    default: false
  },
  buildDiscussionPath: {
    type: Function,
    required: true
  },
  formatDate: {
    type: Function,
    required: true
  }
})
</script>

<style scoped>
.content-section {
  padding: 25px;
  min-height: 200px;
}

.section-state-block {
  margin: 0;
}

.post-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.post-item {
  padding: 20px 0;
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.15s;
}

.post-item:hover {
  background: #fafbfc;
  margin: 0 -25px;
  padding: 20px 25px;
}

.post-item:last-child {
  border-bottom: none;
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.post-header-main {
  display: flex;
  align-items: center;
  gap: 10px;
}

.post-discussion-link {
  color: #4d698e;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
}

.post-discussion-link:hover {
  text-decoration: none;
  color: #3d5875;
}

.post-discussion-link i {
  font-size: 12px;
}

.post-time {
  font-size: 13px;
  color: #aaa;
}

.post-content {
  color: #555;
  line-height: 1.7;
  font-size: 15px;
}

.approval-pill {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  background: #fff3cd;
  color: #856404;
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
}

.approval-pill--rejected {
  background: #fdeeee;
  color: #b14545;
}

.approval-note {
  margin: 10px 0 0;
  color: #9a5050;
  font-size: 13px;
  line-height: 1.6;
}
</style>
