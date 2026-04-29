<template>
  <li
    class="discussion-list-item"
    :class="{ 'is-sticky': discussion.is_sticky, 'is-unread': discussion.is_unread }"
  >
    <div class="discussion-list-item-content">
      <div class="discussion-list-item-author">
        <router-link :to="buildUserPath(discussion.user)" class="avatar-link">
          <img
            v-if="discussion.user?.avatar_url"
            :src="discussion.user.avatar_url"
            :alt="getUserDisplayName(discussion.user)"
            class="avatar avatar-image"
          />
          <div v-else class="avatar" :style="{ backgroundColor: getUserAvatarColor(discussion.user) }">
            {{ getUserInitial(discussion.user) }}
          </div>
        </router-link>
        <div class="discussion-list-item-badges">
          <span v-if="discussion.is_sticky" class="badge badge-pinned" title="置顶">
            <i class="fas fa-thumbtack"></i>
          </span>
          <span v-if="discussion.is_locked" class="badge badge-locked" title="锁定">
            <i class="fas fa-lock"></i>
          </span>
        </div>
      </div>

      <div class="discussion-list-item-main">
        <div class="discussion-title-row">
          <router-link :to="buildDiscussionPath(discussion)" class="discussion-list-item-title">
            {{ discussion.title }}
          </router-link>
          <span v-if="discussion.approval_status === 'pending'" class="approval-pill">待审核</span>
          <span v-else-if="discussion.approval_status === 'rejected'" class="approval-pill approval-pill--rejected">已拒绝</span>
          <span v-if="discussion.is_unread" class="unread-pill">{{ discussion.unread_count }} 条未读</span>
          <span v-if="discussion.is_subscribed" class="subscription-pill">已关注</span>
        </div>
        <p v-if="discussion.approval_status === 'rejected' && discussion.approval_note" class="approval-note">
          审核反馈：{{ discussion.approval_note }}
        </p>

        <ul class="discussion-list-item-info">
          <li v-if="discussion.tags.length" class="item-tags">
            <router-link
              v-for="tag in discussion.tags"
              :key="tag.id"
              :to="buildTagPath(tag)"
              class="tag-label"
              :style="{ backgroundColor: tag.color }"
            >
              {{ tag.name }}
            </router-link>
          </li>
          <li class="item-author">
            <router-link :to="buildUserPath(discussion.user)" class="username">
              {{ discussion.user?.display_name || discussion.user?.username }}
            </router-link>
            发起于 {{ formatRelativeTime(discussion.created_at) }}
          </li>
          <li v-if="discussion.last_posted_at" class="item-last-post">
            <i class="fas fa-reply"></i>
            最后回复 {{ formatRelativeTime(discussion.last_posted_at) }}
          </li>
        </ul>
      </div>

      <div class="discussion-list-item-stats">
        <span class="discussion-list-item-count">
          <i class="far fa-comment"></i>
          <span>{{ discussion.comment_count }}</span>
        </span>
      </div>
    </div>
  </li>
</template>

<script setup>
defineProps({
  discussion: {
    type: Object,
    required: true
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
</script>

<style scoped>
.discussion-list-item {
  border-bottom: 1px solid var(--forum-border-soft);
  transition: background 0.2s;
}

.discussion-list-item:hover {
  background: var(--forum-bg-elevated-strong);
}

.discussion-list-item.is-sticky {
  background: #fffbf0;
}

.discussion-list-item.is-sticky:hover {
  background: #fff8e1;
}

.discussion-list-item.is-unread {
  background: #f8fbff;
}

.discussion-list-item.is-unread:hover {
  background: #f1f7fd;
}

.discussion-list-item.is-unread .discussion-list-item-title {
  font-weight: 600;
  color: var(--forum-text-color);
}

.discussion-list-item-content {
  display: flex;
  gap: 16px;
  padding: 12px 26px 12px 26px;
  position: relative;
}

.discussion-list-item-author {
  position: relative;
  flex-shrink: 0;
}

.avatar-link {
  display: block;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 14px;
  font-weight: 600;
}

.avatar-image {
  object-fit: cover;
}

.discussion-list-item-badges {
  position: absolute;
  top: -14px;
  left: -2px;
  display: flex;
  gap: 4px;
}

.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 3px;
  font-size: 10px;
}

.badge-pinned {
  background: #ffc107;
  color: #856404;
}

.badge-locked {
  background: #999;
  color: white;
}

.discussion-list-item-main {
  flex: 1;
  min-width: 0;
}

.discussion-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  margin-bottom: 3px;
}

.discussion-list-item-title {
  display: block;
  font-size: var(--forum-font-size-lg);
  font-weight: normal;
  color: var(--forum-text-color);
  margin: 0;
  line-height: 1.3;
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.discussion-list-item-title:hover {
  color: var(--forum-primary-color);
  text-decoration: none;
}

.discussion-list-item-info {
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: 11px;
  color: var(--forum-text-soft);
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.discussion-list-item-info > li {
  display: flex;
  align-items: center;
  gap: 4px;
}

.item-tags {
  display: flex;
  gap: 6px;
}

.tag-label {
  padding: 2px 8px;
  border-radius: 3px;
  color: white;
  font-size: 11px;
  font-weight: 500;
}

.subscription-pill {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: var(--forum-radius-pill);
  background: #edf4fb;
  color: var(--forum-primary-color);
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
}

.approval-pill {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: var(--forum-radius-pill);
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
  margin: 0 0 6px;
  color: #9a5050;
  font-size: 12px;
  line-height: 1.6;
}

.unread-pill {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: var(--forum-radius-pill);
  background: var(--forum-primary-color);
  color: var(--forum-text-inverse);
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
}

.username {
  font-weight: bold;
  color: #666;
}

.item-last-post i {
  font-size: 10px;
}

.discussion-list-item-stats {
  width: 40px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
}

.discussion-list-item-count {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--forum-text-soft);
  font-size: 14px;
  text-decoration: none;
}

.discussion-list-item-count:hover {
  color: var(--forum-text-color);
  text-decoration: none;
}

@media (max-width: 768px) {
  .discussion-list-item-content {
    gap: 12px;
    padding: 12px 15px 14px;
  }

  .avatar {
    width: 32px;
    height: 32px;
    font-size: 13px;
  }

  .discussion-list-item-badges {
    top: -12px;
    left: -4px;
  }

  .badge {
    width: 18px;
    height: 18px;
    font-size: 9px;
  }

  .discussion-list-item-main {
    padding-right: 52px;
  }

  .discussion-title-row {
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 6px;
    margin-bottom: 5px;
  }

  .discussion-list-item-title {
    font-size: 14px;
    line-height: 1.35;
    white-space: normal;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .approval-note {
    margin-bottom: 8px;
    font-size: 11px;
  }

  .discussion-list-item-info {
    gap: 6px 8px;
    font-size: 12px;
    line-height: 1.5;
  }

  .discussion-list-item-info > li {
    max-width: 100%;
  }

  .item-tags {
    flex-wrap: wrap;
  }

  .tag-label,
  .subscription-pill,
  .approval-pill,
  .unread-pill {
    font-size: 10px;
  }

  .discussion-list-item-stats {
    width: auto;
    position: absolute;
    top: 12px;
    right: 15px;
  }

  .discussion-list-item-count {
    min-width: 34px;
    justify-content: center;
    padding: 3px 8px;
    gap: 0;
    border-radius: 999px;
    background: #edf2f6;
    color: #647384;
    font-size: 12px;
    font-weight: 700;
  }

  .discussion-list-item-count i {
    display: none;
  }

  .discussion-list-item.is-unread .discussion-list-item-count {
    background: var(--forum-primary-color);
    color: #fff;
  }
}
</style>
