import { ref } from 'vue'
import api from '@/api'
import { getUiCopy } from '@/forum/registry'
import { useDiscussionDetailModerationActions } from '@/composables/useDiscussionDetailModerationActions'
import { useResourceStore } from '@/stores/resource'
import { formatRelativeTime } from '@/utils/forum'
import PostReportModal from '@/components/modals/PostReportModal.vue'

export function useDiscussionDetailInteractions({
  authStore,
  canEditDiscussion,
  canLikePost,
  canModeratePendingDiscussion,
  canModeratePendingPost,
  canModeratePostVisibility,
  composerStore,
  discussion,
  formatAbsoluteDate,
  hasActiveComposer,
  isSuspended,
  modalStore,
  patchDiscussion,
  refreshDiscussion,
  removePost,
  route,
  router,
  suspensionNotice,
  totalPosts,
  upsertPost
}) {
  const resourceStore = useResourceStore()
  const likePendingPostIds = ref([])

  function uiText(surface, fallback, context = {}) {
    return getUiCopy({
      surface,
      ...context,
    })?.text || fallback
  }

  function getUiErrorMessage(error, fallback = uiText('discussion-detail-action-retry-message', '请稍后重试')) {
    return error.response?.data?.error || error.response?.data?.detail || error.message || fallback
  }

  async function showActionError(actionLabel, error, fallback = uiText('discussion-detail-action-retry-message', '请稍后重试')) {
    await modalStore.alert({
      title: uiText('discussion-detail-action-error-title', '操作失败', { actionLabel }),
      message: getUiErrorMessage(error, fallback),
      tone: 'danger'
    })
  }

  function showSuspensionAlert() {
    return modalStore.alert({
      title: uiText('discussion-detail-suspension-alert-title', '账号已被封禁'),
      message: suspensionNotice.value,
      tone: 'danger'
    })
  }

  async function toggleLike(post) {
    if (!authStore.isAuthenticated) {
      router.push('/login')
      return
    }
    if (!canLikePost(post)) {
      return
    }
    if (isSuspended.value) {
      await showSuspensionAlert()
      return
    }
    if (likePendingPostIds.value.includes(post.id)) {
      return
    }

    likePendingPostIds.value.push(post.id)
    const previousLiked = Boolean(post.is_liked)
    const previousLikeCount = Number(post.like_count || 0)
    try {
      if (previousLiked) {
        resourceStore.patch('posts', post.id, {
          like_count: Math.max(0, previousLikeCount - 1),
          is_liked: false,
        })
        await api.delete(`/posts/${post.id}/like`)
      } else {
        resourceStore.patch('posts', post.id, {
          like_count: previousLikeCount + 1,
          is_liked: true,
        })
        await api.post(`/posts/${post.id}/like`)
      }
    } catch (error) {
      resourceStore.patch('posts', post.id, {
        like_count: previousLikeCount,
        is_liked: previousLiked,
      })
      console.error('点赞失败:', error)
      await showActionError('点赞', error)
    } finally {
      likePendingPostIds.value = likePendingPostIds.value.filter(id => id !== post.id)
    }
  }

  function replyToPost(post) {
    if (isSuspended.value) {
      showSuspensionAlert()
      return
    }
    composerStore.openReplyComposer({
      source: 'discussion-detail',
      discussionId: discussion.value?.id,
      discussionTitle: discussion.value?.title || '',
      postId: post.id,
      postNumber: post.number,
      username: post.user.username,
      initialContent: `@${post.user.username} `
    })
  }

  function editPost(post) {
    if (isSuspended.value) {
      showSuspensionAlert()
      return
    }
    composerStore.openEditPostComposer({
      source: 'discussion-detail',
      discussionId: discussion.value?.id,
      discussionTitle: discussion.value?.title || '',
      postId: post.id,
      postNumber: post.number,
      username: post.user.username,
      approvalStatus: post.approval_status || '',
      approvalNote: post.approval_note || '',
      initialContent: post.content
    })
  }

  function editDiscussion() {
    if (!discussion.value || !canEditDiscussion.value) return
    if (isSuspended.value) {
      showSuspensionAlert()
      return
    }

    const primaryTag = (discussion.value.tags || []).find(tag => !tag.parent_id)
    const secondaryTag = (discussion.value.tags || []).find(tag => tag.parent_id)

    composerStore.openEditDiscussionComposer({
      source: 'discussion-detail',
      discussionId: discussion.value.id,
      discussionTitle: discussion.value.title || '',
      approvalStatus: discussion.value.approval_status || '',
      approvalNote: discussion.value.approval_note || '',
      initialTitle: discussion.value.title || '',
      initialContent: discussion.value.first_post?.content || '',
      initialPrimaryTagId: primaryTag?.id || '',
      initialSecondaryTagId: secondaryTag?.id || ''
    })
  }

  function openComposer() {
    if (isSuspended.value) {
      showSuspensionAlert()
      return
    }
    if (hasActiveComposer.value) {
      composerStore.showComposer()
      return
    }

    composerStore.openReplyComposer({
      source: 'discussion-detail',
      discussionId: discussion.value?.id,
      discussionTitle: discussion.value?.title || '',
      postId: null,
      postNumber: null,
      username: '',
      initialContent: ''
    })
  }

  function goToLoginForReply() {
    router.push({
      name: 'login',
      query: {
        redirect: route.fullPath
      }
    })
  }

  async function deletePost(post) {
    try {
      await api.delete(`/posts/${post.id}`)
      removePost(post.id)
      const shouldRefreshDiscussion = Number(post?.number || 0) >= Number(discussion.value?.last_post_number || 0)

      patchDiscussion(currentDiscussion => ({
        comment_count: Math.max(0, Number(currentDiscussion.comment_count || 0) - 1),
      }))
      totalPosts.value = Math.max(0, totalPosts.value - 1)

      if (shouldRefreshDiscussion) {
        await refreshDiscussion()
      }
    } catch (error) {
      console.error('删除失败:', error)
      await showActionError('删除', error)
    }
  }

  async function openReportModal(post) {
    if (isSuspended.value) {
      await showSuspensionAlert()
      return
    }

    try {
      const result = await modalStore.show(
        PostReportModal,
        {
          post,
          submitReport: payload => api.post(`/posts/${post.id}/report`, payload)
        },
        {
          size: 'small'
        }
      )

      if (result?.reported) {
        resourceStore.patch('posts', post.id, {
          viewer_has_open_flag: true,
        })
        await modalStore.alert({
          title: uiText('discussion-detail-report-success-title', '举报已提交'),
          message: uiText('discussion-detail-report-success-message', '版主会尽快查看并处理。')
        })
      }
    } catch (error) {
      console.error('举报失败:', error)
      await showActionError('举报', error)
    }
  }

  const moderationActions = useDiscussionDetailModerationActions({
    authStore,
    canModeratePendingDiscussion,
    canModeratePendingPost,
    canModeratePostVisibility,
    discussion,
    isSuspended,
    modalStore,
    patchDiscussion,
    refreshDiscussion,
    router,
    showActionError,
    showSuspensionAlert,
    uiText,
    upsertPost,
  })

  function formatDate(dateString) {
    return formatRelativeTime(dateString)
  }

  function formatLikeSummary(post) {
    const count = Number(post?.like_count || 0)
    return uiText('discussion-detail-like-summary', '', {
      count,
      isLiked: Boolean(post?.is_liked),
    })
  }

  const discussionActionHandlers = {
    delete: async () => {
      await moderationActions.deleteDiscussion()
    },
    edit: async () => {
      editDiscussion()
    },
    login: async () => {
      goToLoginForReply()
    },
    reply: async () => {
      openComposer()
    },
    'toggle-hide': async () => {
      await moderationActions.toggleHide()
    },
    'toggle-lock': async () => {
      await moderationActions.toggleLock()
    },
    'toggle-pin': async () => {
      await moderationActions.togglePin()
    },
    'toggle-subscription': async () => {
      await moderationActions.toggleSubscription()
    },
  }

  const postActionHandlers = {
    'delete-post': async (_, context = {}) => {
      await deletePost(context.post)
    },
    'edit-post': async (_, context = {}) => {
      editPost(context.post)
    },
    'open-report-modal': async (_, context = {}) => {
      await openReportModal(context.post)
    },
    'toggle-hide-post': async (_, context = {}) => {
      await moderationActions.togglePostHidden(context.post)
    },
  }

  return {
    deletePost,
    editDiscussion,
    editPost,
    formatAbsoluteDate,
    formatDate,
    formatLikeSummary,
    goToLoginForReply,
    isSuspended,
    likePendingPostIds,
    openComposer,
    openReportModal,
    postActionHandlers,
    replyToPost,
    discussionActionHandlers,
    showSuspensionAlert,
    suspensionNotice,
    toggleLike,
    ...moderationActions,
  }
}
