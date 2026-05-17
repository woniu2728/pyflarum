import { computed } from 'vue'
import {
  formatMonth,
  formatRelativeTime
} from '@/utils/forum'
import {
  getUserPrimaryGroupColor,
  getUserPrimaryGroupIcon,
  getUserPrimaryGroupLabel,
} from '@/utils/userPrimaryGroup'

export function useProfilePresentation(user) {
  const isOnline = computed(() => {
    if (!user.value?.last_seen_at) return false

    const lastSeen = new Date(user.value.last_seen_at)
    const now = new Date()
    return (now - lastSeen) < 5 * 60 * 1000
  })

  function formatDate(dateString) {
    return formatRelativeTime(dateString)
  }

  function formatJoinDate(dateString) {
    return formatMonth(dateString)
  }

  function formatLastSeen(dateString) {
    if (!dateString) return '从未'

    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return '刚刚活跃'
    if (minutes < 60) return `${minutes}分钟前活跃`
    if (hours < 24) return `${hours}小时前活跃`
    if (days < 30) return `${days}天前活跃`

    return date.toLocaleDateString('zh-CN')
  }

  return {
    isOnline,
    getUserPrimaryGroupIcon,
    getUserPrimaryGroupColor(userValue) {
      return getUserPrimaryGroupColor(userValue, '#4d698e')
    },
    getUserPrimaryGroupLabel,
    formatDate,
    formatJoinDate,
    formatLastSeen
  }
}
