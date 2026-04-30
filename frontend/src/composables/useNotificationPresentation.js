import { computed } from 'vue'
import api from '@/api'
import { buildDiscussionPath } from '@/utils/forum'
import { renderTwemojiText } from '@/utils/twemoji'

export function getNotificationIconClass(type) {
  const icons = {
    discussionReply: 'fas fa-reply',
    postLiked: 'fas fa-thumbs-up',
    userMentioned: 'fas fa-at',
    postReply: 'fas fa-comment-dots',
    discussionApproved: 'fas fa-circle-check',
    discussionRejected: 'fas fa-circle-xmark',
    postApproved: 'fas fa-check',
    postRejected: 'fas fa-xmark',
    userSuspended: 'fas fa-user-lock',
    userUnsuspended: 'fas fa-user-check',
    discussionCreated: 'fas fa-pen',
    postCreated: 'fas fa-message'
  }
  return icons[type] || 'fas fa-bell'
}

export function getNotificationText(notification, fallbackMessage = '') {
  const fromUser = notification.from_user?.display_name || notification.from_user?.username || '有人'
  const discussionTitle = notification.data?.discussion_title || ''
  const approvalNote = notification.data?.approval_note ? `：${notification.data.approval_note}` : ''
  const suspendMessage = notification.data?.suspend_message ? `：${notification.data.suspend_message}` : ''

  switch (notification.type) {
    case 'discussionReply':
      return `${fromUser} 回复了你的讨论 "${discussionTitle}"`
    case 'postLiked':
      return `${fromUser} 点赞了你的回复`
    case 'userMentioned':
      return `${fromUser} 在回复中提到了你`
    case 'postReply':
      return `${fromUser} 回复了你的帖子`
    case 'discussionApproved':
      return `${fromUser} 通过了你的讨论 "${discussionTitle}"`
    case 'discussionRejected':
      return `${fromUser} 拒绝了你的讨论 "${discussionTitle}"${approvalNote}`
    case 'postApproved':
      return `${fromUser} 通过了你在 "${discussionTitle}" 中的回复`
    case 'postRejected':
      return `${fromUser} 拒绝了你在 "${discussionTitle}" 中的回复${approvalNote}`
    case 'userSuspended':
      return `${fromUser} 已封禁你的账号${suspendMessage}`
    case 'userUnsuspended':
      return `${fromUser} 已解除你的账号封禁`
    case 'discussionCreated':
      return `${fromUser} 发起了新讨论 "${discussionTitle}"`
    case 'postCreated':
      return `${fromUser} 发表了新回复`
    default:
      return fallbackMessage || notification.message || '你有新通知'
  }
}

export function getNotificationTextHtml(notification, fallbackMessage = '') {
  return renderTwemojiText(getNotificationText(notification, fallbackMessage))
}

export async function resolveNotificationPath(notification) {
  const discussionId = notification.data?.discussion_id
  const postId = notification.data?.post_id
  const postNumber = notification.data?.post_number

  if (discussionId && postNumber) {
    return `/d/${discussionId}?near=${postNumber}`
  }

  if (discussionId && postId) {
    try {
      const post = await api.get(`/posts/${postId}`)
      if (post?.number) {
        return `/d/${discussionId}?near=${post.number}`
      }
    } catch (error) {
      console.error('解析通知跳转帖子失败:', error)
    }
  }

  if (discussionId) {
    return buildDiscussionPath(discussionId)
  }

  if (notification.type === 'userSuspended' || notification.type === 'userUnsuspended') {
    return '/profile'
  }

  return '/notifications'
}

export function useNotificationGroups(notificationItems, fallbackTitle = '论坛') {
  return computed(() => {
    const groups = []
    const seen = new Map()

    for (const notification of notificationItems.value) {
      const discussionId = notification.data?.discussion_id || 0
      const key = discussionId ? `discussion-${discussionId}` : 'general'

      if (!seen.has(key)) {
        const group = {
          key,
          discussionId,
          title: notification.data?.discussion_title || fallbackTitle,
          items: []
        }
        seen.set(key, group)
        groups.push(group)
      }

      seen.get(key).items.push(notification)
    }

    return groups
  })
}
