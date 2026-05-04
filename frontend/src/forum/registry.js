import { buildUserPath } from '@/utils/forum'
import {
  getForumNavItems,
  registerDiscussionAction,
  registerForumNavItem,
  registerHeaderItem,
  registerPostAction,
} from '@/forum/frontendRegistry'

export {
  getForumNavItems,
  registerDiscussionAction,
  registerForumNavItem,
  registerHeaderItem,
  registerPostAction,
}

registerForumNavItem({
  key: 'home',
  to: '/',
  icon: 'far fa-comments',
  label: '全部讨论',
  order: 10
})

registerForumNavItem({
  key: 'following',
  to: '/following',
  icon: 'fas fa-bell',
  label: '关注中',
  order: 20,
  isVisible: ({ authStore }) => Boolean(authStore?.user)
})

registerForumNavItem({
  key: 'tags',
  to: '/tags',
  icon: 'fas fa-tags',
  label: '全部标签',
  order: 30
})

registerForumNavItem({
  key: 'notifications',
  to: '/notifications',
  icon: 'fas fa-inbox',
  label: '通知',
  order: 40,
  isVisible: ({ showNotifications }) => Boolean(showNotifications)
})

registerHeaderItem({
  key: 'notifications-shortcut',
  placement: 'account-start',
  order: 10,
  icon: 'fas fa-inbox',
  label: '通知中心',
  to: '/notifications',
  isVisible: ({ authStore }) => Boolean(authStore?.isAuthenticated && authStore?.user)
})

registerHeaderItem({
  key: 'admin-shortcut',
  placement: 'account-start',
  order: 20,
  icon: 'fas fa-cubes',
  label: '模块中心',
  href: '/admin.html#/admin/modules',
  isVisible: ({ authStore }) => Boolean(authStore?.user?.is_staff)
})

registerHeaderItem({
  key: 'mobile-admin-shortcut',
  placement: 'mobile-user',
  order: 10,
  icon: 'fas fa-cubes',
  label: '模块中心',
  href: '/admin.html#/admin/modules',
  isVisible: ({ authStore }) => Boolean(authStore?.user?.is_staff)
})

registerForumNavItem({
  key: 'profile',
  to: ({ authStore }) => buildUserPath(authStore.user),
  icon: 'fas fa-user',
  label: '我的主页',
  order: 50,
  isVisible: ({ authStore }) => Boolean(authStore?.user)
})
