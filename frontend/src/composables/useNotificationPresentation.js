import { computed } from 'vue'
import {
  getNotificationIcon,
  getNotificationPresentation,
  resolveNotificationGroup,
  getNotificationText,
  resolveNotificationPath,
} from '@/forum/notificationTypes'
import { renderTwemojiText } from '@/utils/twemoji'

export { getNotificationPresentation, getNotificationText, resolveNotificationPath }

export function getNotificationIconClass(type) {
  return getNotificationIcon(type)
}

export function getNotificationTextHtml(notification, fallbackMessage = '') {
  return renderTwemojiText(getNotificationText(notification, fallbackMessage))
}

export function getNotificationPresentationModel(notification, fallbackMessage = '') {
  const presentation = getNotificationPresentation(notification, fallbackMessage)
  return {
    ...presentation,
    messageHtml: renderTwemojiText(presentation.messageText || ''),
  }
}

export function useNotificationGroups(notificationItems, fallbackTitle = '论坛') {
  return computed(() => {
    const groups = []
    const seen = new Map()

    for (const notification of notificationItems.value) {
      const resolvedGroup = resolveNotificationGroup(notification, fallbackTitle)
      const discussionId = Number(resolvedGroup.discussionId || 0)
      const key = resolvedGroup.key || 'general'

      if (!seen.has(key)) {
        const group = {
          key,
          discussionId,
          title: resolvedGroup.title || fallbackTitle,
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
