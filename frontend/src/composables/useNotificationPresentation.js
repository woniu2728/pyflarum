import { computed } from 'vue'
import {
  getNotificationIcon,
  getNotificationText,
  resolveNotificationPath,
} from '@/forum/notificationTypes'
import { renderTwemojiText } from '@/utils/twemoji'

export { getNotificationText, resolveNotificationPath }

export function getNotificationIconClass(type) {
  return getNotificationIcon(type)
}

export function getNotificationTextHtml(notification, fallbackMessage = '') {
  return renderTwemojiText(getNotificationText(notification, fallbackMessage))
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
