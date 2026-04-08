import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref([])
  const unreadCount = ref(0)
  const ws = ref(null)

  // 连接WebSocket
  function connect() {
    const token = localStorage.getItem('access_token')
    if (!token) return

    ws.value = new WebSocket(`ws://localhost:8000/ws/notifications/`)

    ws.value.onopen = () => {
      console.log('WebSocket连接成功')

      // 发送心跳
      setInterval(() => {
        if (ws.value?.readyState === WebSocket.OPEN) {
          ws.value.send(JSON.stringify({ type: 'ping' }))
        }
      }, 30000)
    }

    ws.value.onmessage = (event) => {
      const data = JSON.parse(event.data)

      if (data.type === 'notification') {
        // 收到新通知
        notifications.value.unshift(data.notification)
        unreadCount.value++

        // 显示浏览器通知
        if (Notification.permission === 'granted') {
          new Notification('新通知', {
            body: getNotificationMessage(data.notification),
            icon: '/favicon.ico'
          })
        }
      }
    }

    ws.value.onerror = (error) => {
      console.error('WebSocket错误:', error)
    }

    ws.value.onclose = () => {
      console.log('WebSocket连接关闭')
      // 5秒后重连
      setTimeout(() => {
        connect()
      }, 5000)
    }
  }

  // 断开连接
  function disconnect() {
    if (ws.value) {
      ws.value.close()
      ws.value = null
    }
  }

  // 标记为已读
  function markAsRead(notificationId) {
    if (ws.value?.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify({
        type: 'mark_read',
        notification_id: notificationId
      }))
    }

    const notification = notifications.value.find(n => n.id === notificationId)
    if (notification && !notification.is_read) {
      notification.is_read = true
      unreadCount.value--
    }
  }

  // 获取通知消息
  function getNotificationMessage(notification) {
    switch (notification.type) {
      case 'discussionReply':
        return '您的讨论有新回复'
      case 'postLiked':
        return '您的帖子被点赞'
      case 'userMentioned':
        return '有人@了您'
      default:
        return '您有新通知'
    }
  }

  // 请求通知权限
  function requestPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }

  return {
    notifications,
    unreadCount,
    connect,
    disconnect,
    markAsRead,
    requestPermission
  }
})
