import { defineAsyncComponent } from 'vue'
import { buildDiscussionPath, buildUserPath, formatRelativeTime, getUserInitial } from '@/utils/forum'
import {
  getComposerNotices,
  getComposerSecondaryActions,
  getComposerStatusItems,
  getComposerTools,
  getForumNavItems,
  getForumNavSections,
  getNotificationRenderers,
  getProfilePanels,
  getSearchSources,
  getDiscussionBadges,
  getDiscussionStateBadges,
  getDiscussionReplyState,
  getPostStateBadges,
  getPostReviewBanner,
  getUserBadges,
  registerDiscussionAction,
  registerDiscussionBadge,
  registerDiscussionReplyState,
  registerDiscussionStateBadge,
  registerPostStateBadge,
  registerPostReviewBanner,
  registerComposerNotice,
  registerComposerSecondaryAction,
  registerComposerStatusItem,
  registerComposerSubmitGuard,
  registerComposerTool,
  registerHeaderItem,
  registerForumNavItem,
  registerForumNavSection,
  registerNotificationRenderer,
  registerProfilePanel,
  registerPostAction,
  registerSearchSource,
  registerUserBadge,
  runComposerSubmitGuards,
} from '@/forum/frontendRegistry'
import { highlightSearchText } from '@/utils/search'
import { renderTwemojiHtml } from '@/utils/twemoji'

export {
  getForumNavItems,
  getForumNavSections,
  getComposerNotices,
  getComposerSecondaryActions,
  getComposerStatusItems,
  getComposerTools,
  getNotificationRenderers,
  getDiscussionBadges,
  getDiscussionStateBadges,
  getDiscussionReplyState,
  getPostStateBadges,
  getPostReviewBanner,
  registerDiscussionAction,
  registerDiscussionBadge,
  registerDiscussionReplyState,
  registerDiscussionStateBadge,
  registerPostStateBadge,
  registerPostReviewBanner,
  registerComposerNotice,
  registerComposerSecondaryAction,
  registerComposerStatusItem,
  registerComposerSubmitGuard,
  registerComposerTool,
  registerHeaderItem,
  registerForumNavItem,
  registerForumNavSection,
  registerNotificationRenderer,
  registerProfilePanel,
  registerPostAction,
  registerSearchSource,
  registerUserBadge,
  runComposerSubmitGuards,
  getProfilePanels,
  getSearchSources,
  getUserBadges,
}

registerForumNavSection({
  key: 'primary',
  title: '',
  order: 10,
})

registerForumNavSection({
  key: 'personal',
  title: '个人',
  order: 20,
})

registerForumNavItem({
  key: 'home',
  to: '/',
  icon: 'far fa-comments',
  label: '全部讨论',
  description: '查看全站最新讨论流。',
  section: 'primary',
  order: 10,
  surfaces: ['primary-nav', 'discussion-sidebar', 'mobile-drawer']
})

registerForumNavItem({
  key: 'following',
  to: '/following',
  icon: 'fas fa-bell',
  label: '关注中',
  description: '查看你关注讨论的更新。',
  section: 'primary',
  order: 20,
  surfaces: ['discussion-sidebar', 'mobile-drawer'],
  isVisible: ({ authStore }) => Boolean(authStore?.user)
})

registerForumNavItem({
  key: 'tags',
  to: '/tags',
  icon: 'fas fa-tags',
  label: '全部标签',
  description: '按标签浏览论坛主题。',
  section: 'primary',
  order: 30,
  surfaces: ['primary-nav', 'mobile-drawer']
})

registerForumNavItem({
  key: 'notifications',
  to: '/notifications',
  icon: 'fas fa-inbox',
  label: '通知',
  description: '查看回复、提及和审核通知。',
  section: 'personal',
  order: 40,
  badge: ({ notificationStore }) => {
    const count = Number(notificationStore?.unreadCount || 0)
    return count > 0 ? count : ''
  },
  isVisible: ({ showNotifications }) => Boolean(showNotifications)
})

registerForumNavItem({
  key: 'profile',
  to: ({ authStore }) => buildUserPath(authStore.user),
  icon: 'fas fa-user',
  label: '我的主页',
  description: '查看你的资料、讨论和回复。',
  section: 'personal',
  order: 50,
  surfaces: ['discussion-sidebar', 'mobile-drawer'],
  isVisible: ({ authStore }) => Boolean(authStore?.user)
})

function isOwnProfileRoute(route, user) {
  if (!route || !user) return false
  return route.name === 'profile'
    || (route.name === 'user-profile' && String(route.params.id) === String(user.id))
}

registerHeaderItem({
  key: 'user-profile-menu',
  placement: 'user-menu',
  order: 10,
  icon: 'fas fa-user',
  label: '个人资料',
  to: ({ authStore }) => buildUserPath(authStore.user),
  isVisible: ({ authStore }) => Boolean(authStore?.user),
  isActive: ({ route, authStore }) => isOwnProfileRoute(route, authStore?.user),
})

registerHeaderItem({
  key: 'guest-login',
  placement: 'guest-actions',
  order: 10,
  label: '登录',
  isVisible: ({ authStore }) => !authStore?.user,
  onClick: ({ openLogin }) => openLogin?.(),
})

registerHeaderItem({
  key: 'guest-register',
  placement: 'guest-actions',
  order: 20,
  label: '注册',
  tone: 'primary',
  isVisible: ({ authStore }) => !authStore?.user,
  onClick: ({ openRegister }) => openRegister?.(),
})

registerHeaderItem({
  key: 'user-notifications-menu',
  placement: 'user-menu',
  order: 20,
  icon: 'fas fa-bell',
  label: '通知',
  to: '/notifications',
  badge: ({ notificationStore }) => {
    const count = Number(notificationStore?.unreadCount || 0)
    return count > 0 ? count : ''
  },
  isVisible: ({ authStore }) => Boolean(authStore?.user),
  isActive: ({ route }) => route?.name === 'notifications',
})

registerHeaderItem({
  key: 'user-admin-menu',
  placement: 'user-menu',
  order: 30,
  icon: 'fas fa-cog',
  label: '管理后台',
  href: '/admin.html',
  isVisible: ({ authStore }) => Boolean(authStore?.user?.is_staff),
})

registerHeaderItem({
  key: 'user-logout-menu',
  placement: 'user-menu',
  order: 40,
  icon: 'fas fa-sign-out-alt',
  label: '登出',
  tone: 'danger',
  separated: true,
  isVisible: ({ authStore }) => Boolean(authStore?.user),
  onClick: ({ handleLogout }) => handleLogout?.(),
})

registerHeaderItem({
  key: 'mobile-notifications',
  placement: 'mobile-drawer-personal',
  order: 10,
  icon: 'fas fa-inbox',
  label: '通知',
  to: '/notifications',
  badge: ({ notificationStore }) => {
    const count = Number(notificationStore?.unreadCount || 0)
    return count > 0 ? count : ''
  },
  isVisible: ({ authStore }) => Boolean(authStore?.user),
  isActive: ({ route }) => route?.name === 'notifications',
})

registerHeaderItem({
  key: 'mobile-profile',
  placement: 'mobile-drawer-personal',
  order: 20,
  icon: 'fas fa-user',
  label: '我的主页',
  to: ({ authStore }) => buildUserPath(authStore.user),
  isVisible: ({ authStore }) => Boolean(authStore?.user),
  isActive: ({ route, authStore }) => isOwnProfileRoute(route, authStore?.user),
})

registerHeaderItem({
  key: 'mobile-admin',
  placement: 'mobile-drawer-user',
  order: 10,
  icon: 'fas fa-cog',
  label: '管理后台',
  href: '/admin.html',
  isVisible: ({ authStore }) => Boolean(authStore?.user?.is_staff),
})

registerHeaderItem({
  key: 'mobile-logout',
  placement: 'mobile-drawer-user',
  order: 20,
  icon: 'fas fa-sign-out-alt',
  label: '登出',
  tone: 'danger',
  isVisible: ({ authStore }) => Boolean(authStore?.user),
  onClick: ({ handleLogout }) => handleLogout?.(),
})

registerHeaderItem({
  key: 'mobile-guest-login',
  placement: 'mobile-drawer-auth',
  order: 10,
  label: '登录',
  isVisible: ({ authStore }) => !authStore?.user,
  onClick: ({ openLogin }) => openLogin?.(),
})

registerHeaderItem({
  key: 'mobile-guest-register',
  placement: 'mobile-drawer-auth',
  order: 20,
  label: '注册',
  tone: 'primary',
  isVisible: ({ authStore }) => !authStore?.user,
  onClick: ({ openRegister }) => openRegister?.(),
})

function registerDefaultNotificationRenderer(definition) {
  return registerNotificationRenderer({
    ...definition,
    key: definition.key || definition.type,
  })
}

function buildSearchTextHtml(value, query, limit) {
  return renderTwemojiHtml(highlightSearchText(value, query, limit))
}

registerDefaultNotificationRenderer({
  type: 'discussionReply',
  label: '讨论新回复',
  icon: 'fas fa-reply',
  navigationScope: 'post',
  groupLabel: '讨论互动',
  order: 10,
  getText(notification) {
    const fromUser = notification?.from_user?.display_name || notification?.from_user?.username || '有人'
    const discussionTitle = notification?.data?.discussion_title || ''
    return `${fromUser} 回复了你的讨论 "${discussionTitle}"`
  },
})

registerDefaultNotificationRenderer({
  type: 'postLiked',
  label: '回复被点赞',
  icon: 'fas fa-thumbs-up',
  navigationScope: 'post',
  groupLabel: '互动反馈',
  order: 20,
  getText(notification) {
    const fromUser = notification?.from_user?.display_name || notification?.from_user?.username || '有人'
    return `${fromUser} 点赞了你的回复`
  },
})

registerDefaultNotificationRenderer({
  type: 'userMentioned',
  label: '@提及通知',
  icon: 'fas fa-at',
  navigationScope: 'post',
  groupLabel: '互动反馈',
  order: 30,
  getText(notification) {
    const fromUser = notification?.from_user?.display_name || notification?.from_user?.username || '有人'
    return `${fromUser} 在回复中提到了你`
  },
})

registerDefaultNotificationRenderer({
  type: 'postReply',
  label: '回复被回应',
  icon: 'fas fa-comment-dots',
  navigationScope: 'post',
  groupLabel: '互动反馈',
  order: 40,
  getText(notification) {
    const fromUser = notification?.from_user?.display_name || notification?.from_user?.username || '有人'
    return `${fromUser} 回复了你的帖子`
  },
})

registerDefaultNotificationRenderer({
  type: 'discussionApproved',
  label: '讨论审核通过',
  icon: 'fas fa-circle-check',
  navigationScope: 'discussion',
  groupLabel: '审核结果',
  order: 50,
  getText(notification) {
    const fromUser = notification?.from_user?.display_name || notification?.from_user?.username || '有人'
    const discussionTitle = notification?.data?.discussion_title || ''
    return `${fromUser} 通过了你的讨论 "${discussionTitle}"`
  },
})

registerDefaultNotificationRenderer({
  type: 'discussionRejected',
  label: '讨论审核拒绝',
  icon: 'fas fa-circle-xmark',
  navigationScope: 'discussion',
  groupLabel: '审核结果',
  order: 60,
  getText(notification) {
    const fromUser = notification?.from_user?.display_name || notification?.from_user?.username || '有人'
    const discussionTitle = notification?.data?.discussion_title || ''
    const note = notification?.data?.approval_note ? `：${notification.data.approval_note}` : ''
    return `${fromUser} 拒绝了你的讨论 "${discussionTitle}"${note}`
  },
})

registerDefaultNotificationRenderer({
  type: 'postApproved',
  label: '回复审核通过',
  icon: 'fas fa-check',
  navigationScope: 'post',
  groupLabel: '审核结果',
  order: 70,
  getText(notification) {
    const fromUser = notification?.from_user?.display_name || notification?.from_user?.username || '有人'
    const discussionTitle = notification?.data?.discussion_title || ''
    return `${fromUser} 通过了你在 "${discussionTitle}" 中的回复`
  },
})

registerDefaultNotificationRenderer({
  type: 'postRejected',
  label: '回复审核拒绝',
  icon: 'fas fa-xmark',
  navigationScope: 'post',
  groupLabel: '审核结果',
  order: 80,
  getText(notification) {
    const fromUser = notification?.from_user?.display_name || notification?.from_user?.username || '有人'
    const discussionTitle = notification?.data?.discussion_title || ''
    const note = notification?.data?.approval_note ? `：${notification.data.approval_note}` : ''
    return `${fromUser} 拒绝了你在 "${discussionTitle}" 中的回复${note}`
  },
})

registerDefaultNotificationRenderer({
  type: 'userSuspended',
  label: '账号封禁通知',
  icon: 'fas fa-user-lock',
  navigationScope: 'profile',
  groupLabel: '账号状态',
  order: 90,
  getText(notification) {
    const fromUser = notification?.from_user?.display_name || notification?.from_user?.username || '有人'
    const message = notification?.data?.suspend_message ? `：${notification.data.suspend_message}` : ''
    return `${fromUser} 已封禁你的账号${message}`
  },
})

registerDefaultNotificationRenderer({
  type: 'userUnsuspended',
  label: '账号解除封禁',
  icon: 'fas fa-user-check',
  navigationScope: 'profile',
  groupLabel: '账号状态',
  order: 100,
  getText(notification) {
    const fromUser = notification?.from_user?.display_name || notification?.from_user?.username || '有人'
    return `${fromUser} 已解除你的账号封禁`
  },
})

registerDefaultNotificationRenderer({
  type: 'discussionCreated',
  label: '发起讨论',
  icon: 'fas fa-pen',
  navigationScope: 'discussion',
  groupLabel: '讨论动态',
  order: 110,
  getText(notification) {
    const fromUser = notification?.from_user?.display_name || notification?.from_user?.username || '有人'
    const discussionTitle = notification?.data?.discussion_title || ''
    return `${fromUser} 发起了新讨论 "${discussionTitle}"`
  },
})

registerDefaultNotificationRenderer({
  type: 'postCreated',
  label: '发表回复',
  icon: 'fas fa-message',
  navigationScope: 'post',
  groupLabel: '讨论动态',
  order: 120,
  getText(notification) {
    const fromUser = notification?.from_user?.display_name || notification?.from_user?.username || '有人'
    return `${fromUser} 发表了新回复`
  },
})

registerSearchSource({
  key: 'discussions',
  type: 'discussions',
  label: '讨论',
  routeType: 'discussions',
  apiType: 'discussions',
  filterTarget: 'discussion',
  icon: 'far fa-comments',
  order: 10,
  buildResultItems(items, { query }) {
    return items.map(discussion => ({
      key: `discussion-${discussion.id}`,
      avatarAlt: discussion.user?.display_name || discussion.user?.username || '',
      avatarMode: Boolean(discussion.user?.avatar_url),
      avatarUrl: discussion.user?.avatar_url || '',
      excerptHtml: buildSearchTextHtml(discussion.excerpt || '这个讨论没有更多摘要。', query, 180),
      iconClass: 'far fa-comments',
      metaItems: [
        discussion.user?.display_name || discussion.user?.username || '未知用户',
        `${discussion.comment_count || 0} 回复`,
        formatRelativeTime(discussion.last_posted_at || discussion.created_at),
      ],
      path: buildDiscussionPath(discussion),
      titleHtml: buildSearchTextHtml(discussion.title || '讨论', query, 90),
      titleText: discussion.title || '讨论',
      userLayout: false,
    }))
  },
})

registerSearchSource({
  key: 'posts',
  type: 'posts',
  label: '帖子',
  routeType: 'posts',
  apiType: 'posts',
  filterTarget: 'post',
  icon: 'far fa-comment',
  order: 20,
  buildResultItems(items, { query }) {
    return items.map(post => ({
      key: `post-${post.id}`,
      avatarAlt: post.user?.display_name || post.user?.username || '',
      avatarMode: Boolean(post.user?.avatar_url),
      avatarUrl: post.user?.avatar_url || '',
      excerptHtml: buildSearchTextHtml(post.excerpt || post.content || '', query, 200),
      iconClass: 'far fa-comment',
      metaItems: [
        `#${post.number}`,
        post.user?.display_name || post.user?.username || '未知用户',
        formatRelativeTime(post.created_at),
      ],
      path: `/d/${post.discussion_id}?near=${post.number}`,
      titleHtml: buildSearchTextHtml(post.discussion_title || '帖子结果', query, 90),
      titleText: post.discussion_title || '帖子结果',
      userLayout: false,
    }))
  },
})

registerSearchSource({
  key: 'users',
  type: 'users',
  label: '用户',
  routeType: 'users',
  apiType: 'users',
  filterTarget: '',
  icon: 'far fa-user',
  order: 30,
  buildResultItems(items, { query }) {
    return items.map(user => ({
      key: `user-${user.id}`,
      avatarAlt: user.username || '',
      avatarMode: true,
      avatarText: user.avatar_url ? '' : getUserInitial(user),
      avatarUrl: user.avatar_url || '',
      excerptHtml: buildSearchTextHtml(user.bio || `@${user.username}`, query, 150),
      iconClass: 'far fa-user',
      metaItems: [
        `@${user.username}`,
        `${user.discussion_count || 0} 讨论`,
        `${user.comment_count || 0} 回复`,
      ],
      path: buildUserPath(user),
      titleHtml: buildSearchTextHtml(user.display_name || user.username || '用户', query, 80),
      titleText: user.display_name || user.username || '用户',
      userLayout: true,
    }))
  },
})

registerUserBadge({
  key: 'staff',
  order: 10,
  isVisible: ({ user }) => Boolean(user?.is_staff),
  resolve: () => ({
    label: '管理员',
    className: 'badge-admin',
  }),
})

registerUserBadge({
  key: 'primary-group',
  order: 20,
  isVisible: ({ user }) => Boolean(user?.primary_group?.name),
  resolve: ({ user }) => ({
    label: user.primary_group.name,
    icon: user.primary_group.icon || '',
    color: user.primary_group.color || '#4d698e',
    variant: 'group',
  }),
})

registerDiscussionBadge({
  key: 'sticky',
  order: 10,
  isVisible: ({ discussion }) => Boolean(discussion?.is_sticky),
  resolve: () => ({
    className: 'badge-pinned',
    icon: 'fas fa-thumbtack',
    title: '置顶',
  }),
})

registerDiscussionBadge({
  key: 'locked',
  order: 20,
  isVisible: ({ discussion }) => Boolean(discussion?.is_locked),
  resolve: () => ({
    className: 'badge-locked',
    icon: 'fas fa-lock',
    title: '锁定',
  }),
})

registerDiscussionBadge({
  key: 'hidden',
  order: 30,
  surfaces: ['hero'],
  isVisible: ({ discussion }) => Boolean(discussion?.is_hidden),
  resolve: () => ({
    className: 'badge-hidden',
    label: '隐藏',
  }),
})

registerDiscussionBadge({
  key: 'pending',
  order: 40,
  surfaces: ['hero'],
  isVisible: ({ discussion }) => discussion?.approval_status === 'pending',
  resolve: () => ({
    className: 'badge-pending',
    label: '待审核',
  }),
})

registerDiscussionStateBadge({
  key: 'pending',
  order: 10,
  surfaces: ['discussion-list-item', 'profile-discussion'],
  isVisible: ({ discussion }) => discussion?.approval_status === 'pending',
  resolve: () => ({
    label: '待审核',
    tone: 'warning',
  }),
})

registerDiscussionStateBadge({
  key: 'rejected',
  order: 20,
  surfaces: ['discussion-list-item', 'profile-discussion'],
  isVisible: ({ discussion }) => discussion?.approval_status === 'rejected',
  resolve: () => ({
    label: '已拒绝',
    tone: 'danger',
  }),
})

registerDiscussionStateBadge({
  key: 'unread',
  order: 30,
  surfaces: ['discussion-list-item'],
  isVisible: ({ discussion }) => Boolean(discussion?.is_unread && Number(discussion?.unread_count || 0) > 0),
  resolve: ({ discussion }) => ({
    label: `${discussion.unread_count} 条未读`,
    tone: 'primary',
  }),
})

registerDiscussionStateBadge({
  key: 'subscribed',
  order: 40,
  surfaces: ['discussion-list-item'],
  isVisible: ({ discussion }) => Boolean(discussion?.is_subscribed),
  resolve: () => ({
    label: '已关注',
    tone: 'soft-primary',
  }),
})

registerPostStateBadge({
  key: 'pending',
  order: 10,
  surfaces: ['profile-post', 'discussion-post'],
  isVisible: ({ post }) => post?.approval_status === 'pending',
  resolve: () => ({
    label: '待审核',
    tone: 'warning',
  }),
})

registerPostStateBadge({
  key: 'rejected',
  order: 20,
  surfaces: ['profile-post', 'discussion-post'],
  isVisible: ({ post }) => post?.approval_status === 'rejected',
  resolve: () => ({
    label: '已拒绝',
    tone: 'danger',
  }),
})

registerPostStateBadge({
  key: 'viewer-open-flag',
  order: 30,
  surfaces: ['discussion-post'],
  isVisible: ({ post }) => Boolean(post?.viewer_has_open_flag && !post?.can_moderate_flags),
  resolve: () => ({
    label: '已举报',
    tone: 'info',
  }),
})

registerPostStateBadge({
  key: 'open-flags',
  order: 40,
  surfaces: ['discussion-post'],
  isVisible: ({ post }) => Boolean(Number(post?.open_flag_count || 0) > 0 && post?.can_moderate_flags),
  resolve: ({ post }) => ({
    label: `${post.open_flag_count} 条举报待处理`,
    tone: 'soft-warning',
  }),
})

registerDiscussionReplyState({
  key: 'suspended',
  order: 10,
  surfaces: ['discussion-reply'],
  isVisible: ({ authStore, isSuspended }) => Boolean(authStore?.isAuthenticated && isSuspended),
  resolve: ({ suspensionNotice }) => ({
    kind: 'notice',
    tone: 'warning',
    message: suspensionNotice,
  }),
})

registerDiscussionReplyState({
  key: 'composer',
  order: 20,
  surfaces: ['discussion-reply'],
  isVisible: ({ authStore, discussion }) => Boolean(authStore?.isAuthenticated && discussion?.can_reply),
  resolve: ({ hasActiveComposer }) => ({
    kind: 'composer',
    actionLabel: hasActiveComposer ? '继续编辑回复' : '发表回复',
    hint: hasActiveComposer ? '已有未发布内容' : '',
  }),
})

registerDiscussionReplyState({
  key: 'locked',
  order: 30,
  surfaces: ['discussion-reply'],
  isVisible: ({ discussion }) => Boolean(discussion?.is_locked),
  resolve: () => ({
    kind: 'notice',
    tone: 'warning',
    message: '此讨论已被锁定，无法回复',
  }),
})

registerDiscussionReplyState({
  key: 'pending',
  order: 40,
  surfaces: ['discussion-reply'],
  isVisible: ({ discussion }) => discussion?.approval_status === 'pending',
  resolve: () => ({
    kind: 'notice',
    tone: 'warning',
    message: '讨论正在审核中，暂时无法继续回复',
  }),
})

registerDiscussionReplyState({
  key: 'rejected',
  order: 50,
  surfaces: ['discussion-reply'],
  isVisible: ({ discussion }) => discussion?.approval_status === 'rejected',
  resolve: () => ({
    kind: 'notice',
    tone: 'warning',
    message: '讨论未通过审核，需调整后重新发布',
  }),
})

registerDiscussionReplyState({
  key: 'no-permission',
  order: 60,
  surfaces: ['discussion-reply'],
  isVisible: ({ authStore }) => Boolean(authStore?.isAuthenticated),
  resolve: () => ({
    kind: 'notice',
    tone: 'warning',
    message: '当前没有在此讨论下回复的权限',
  }),
})

registerDiscussionReplyState({
  key: 'guest',
  order: 70,
  surfaces: ['discussion-reply'],
  resolve: () => ({
    kind: 'login',
    tone: 'warning',
    message: '后才能回复',
    linkLabel: '登录',
    to: '/login',
  }),
})

registerPostReviewBanner({
  key: 'pending',
  order: 10,
  surfaces: ['discussion-post'],
  isVisible: ({ post }) => post?.approval_status === 'pending',
  resolve: ({ post, canModeratePendingPost }) => ({
    tone: 'warning',
    message: '这条回复正在审核中，目前仅你和管理员可见。',
    actions: canModeratePendingPost(post)
      ? [
          { key: 'approve', label: '审核通过', tone: 'approve', action: 'approve' },
          { key: 'reject', label: '拒绝回复', tone: 'reject', action: 'reject' },
        ]
      : [],
  }),
})

registerPostReviewBanner({
  key: 'rejected',
  order: 20,
  surfaces: ['discussion-post'],
  isVisible: ({ post }) => post?.approval_status === 'rejected',
  resolve: ({ post, canModeratePendingPost, canEditPost }) => ({
    tone: 'danger',
    message: post.approval_note || '这条回复未通过审核，请根据管理员反馈调整内容。',
    actions: canModeratePendingPost(post)
      ? [
          { key: 'approve', label: '审核通过', tone: 'approve', action: 'approve' },
          { key: 'reject', label: '拒绝回复', tone: 'reject', action: 'reject' },
        ]
      : (canEditPost(post)
          ? [{ key: 'edit', label: '修改后重新提交', tone: 'approve', action: 'edit' }]
          : []),
  }),
})

const ProfileDiscussionSection = defineAsyncComponent(() => import('@/components/profile/ProfileDiscussionSection.vue'))
const ProfilePostSection = defineAsyncComponent(() => import('@/components/profile/ProfilePostSection.vue'))
const ProfileSettingsSection = defineAsyncComponent(() => import('@/components/profile/ProfileSettingsSection.vue'))
const ProfileSecuritySection = defineAsyncComponent(() => import('@/components/profile/ProfileSecuritySection.vue'))

registerProfilePanel({
  key: 'discussions',
  label: '讨论',
  icon: 'fas fa-bars',
  order: 10,
  badge: ({ user }) => Number(user?.discussion_count || 0),
  resolve: context => ({
    component: ProfileDiscussionSection,
    componentProps: {
      discussions: context.discussions,
      loading: context.loadingDiscussions,
      isOwnProfile: context.isOwnProfile,
      buildDiscussionPath: context.buildDiscussionPath,
      formatDate: context.formatDate,
    },
  }),
})

registerProfilePanel({
  key: 'posts',
  label: '回复',
  icon: 'far fa-comment',
  order: 20,
  badge: ({ user }) => Number(user?.comment_count || 0),
  resolve: context => ({
    component: ProfilePostSection,
    componentProps: {
      posts: context.posts,
      loading: context.loadingPosts,
      isOwnProfile: context.isOwnProfile,
      buildDiscussionPath: context.buildDiscussionPath,
      formatDate: context.formatDate,
    },
  }),
})

registerProfilePanel({
  key: 'settings',
  label: '设置',
  icon: 'fas fa-user-cog',
  order: 30,
  isVisible: ({ isOwnProfile }) => Boolean(isOwnProfile),
  resolve: context => ({
    component: ProfileSettingsSection,
    componentProps: {
      user: context.user,
      editForm: context.editForm,
      preferences: context.preferences,
      saving: context.saving,
      settingsSuccess: context.settingsSuccess,
      settingsError: context.settingsError,
      loadingPreferences: context.loadingPreferences,
      savingPreferences: context.savingPreferences,
      preferencesSuccess: context.preferencesSuccess,
      preferencesError: context.preferencesError,
    },
    componentEvents: {
      saveProfile: context.saveProfile,
      savePreferences: context.savePreferences,
    },
  }),
})

registerProfilePanel({
  key: 'security',
  label: '安全',
  icon: 'fas fa-shield-alt',
  order: 40,
  isVisible: ({ isOwnProfile }) => Boolean(isOwnProfile),
  resolve: context => ({
    component: ProfileSecuritySection,
    componentProps: {
      user: context.user,
      passwordForm: context.passwordForm,
      verificationSending: context.verificationSending,
      verificationSuccess: context.verificationSuccess,
      verificationError: context.verificationError,
      changingPassword: context.changingPassword,
      passwordSuccess: context.passwordSuccess,
      passwordError: context.passwordError,
    },
    componentEvents: {
      resendVerification: context.resendVerificationEmail,
      changePassword: context.changePassword,
    },
  }),
})

function formatComposerSuspensionNotice(user = {}, fallbackMessage) {
  if (!user?.is_suspended) return ''

  if (user.suspend_message) {
    return user.suspended_until
      ? `账号已被封禁至 ${formatComposerDateTime(user.suspended_until)}。${user.suspend_message}`
      : `账号当前已被封禁。${user.suspend_message}`
  }

  return user.suspended_until
    ? `账号已被封禁至 ${formatComposerDateTime(user.suspended_until)}，${fallbackMessage}`
    : `账号当前已被封禁，${fallbackMessage}`
}

function formatComposerDateTime(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '未知时间'
  return date.toLocaleString('zh-CN')
}

registerComposerNotice({
  key: 'suspension',
  order: 10,
  isVisible: ({ authStore }) => Boolean(authStore?.user?.is_suspended),
  resolve: ({ authStore, type }) => ({
    label: '账号',
    tone: 'warning',
    message: formatComposerSuspensionNotice(
      authStore.user,
      type === 'discussion' ? '暂时无法发布讨论。' : '暂时无法回复、编辑或上传附件。'
    ),
  }),
})

registerComposerNotice({
  key: 'approval-feedback',
  order: 20,
  isVisible: ({ isEditing, composerStore }) => {
    return Boolean(
      isEditing
      && composerStore?.current?.approvalStatus === 'rejected'
      && composerStore?.current?.approvalNote
    )
  },
  resolve: ({ type, composerStore }) => ({
    label: type === 'discussion' ? '讨论审核反馈' : '回复审核反馈',
    tone: 'warning',
    message: composerStore.current.approvalNote,
  }),
})

registerComposerNotice({
  key: 'discussion-tag-permission',
  order: 30,
  isVisible: ({ type, availablePrimaryTagCount }) => {
    return type === 'discussion' && Number(availablePrimaryTagCount || 0) <= 0
  },
  resolve: () => ({
    label: '标签',
    tone: 'warning',
    message: '当前没有可发帖的标签，请联系管理员开放标签权限。',
  }),
})

registerComposerNotice({
  key: 'discussion-tag-selection',
  order: 40,
  isVisible: ({ type, availablePrimaryTagCount, primaryTagId }) => {
    return type === 'discussion' && Number(availablePrimaryTagCount || 0) > 0 && !primaryTagId
  },
  resolve: () => ({
    label: '标签',
    tone: 'info',
    message: '先选择主标签，再发布讨论。',
  }),
})

registerComposerTool({
  key: 'discussion-template',
  order: 15,
  isVisible: ({ type }) => type === 'discussion',
  resolve: () => ({
    title: '插入讨论模板',
    icon: 'fas fa-clipboard-list',
    async run({ content, insertText, selectionStart, selectionEnd }) {
      const template = [
        '## 背景',
        '',
        '简要说明当前问题或主题背景。',
        '',
        '## 现象',
        '',
        '描述你观察到的结果、错误或争议点。',
        '',
        '## 期望',
        '',
        '说明希望获得的帮助、答案或改进方向。'
      ].join('\n')

      const prefix = content.trim() ? '\n\n' : ''
      const replacement = `${prefix}${template}`
      const cursor = selectionStart + replacement.length
      await insertText(replacement, {
        start: selectionStart,
        end: selectionEnd,
        cursor,
      })
    },
  }),
})

registerComposerSubmitGuard({
  key: 'suspension',
  order: 10,
  isVisible: ({ authStore }) => Boolean(authStore?.user?.is_suspended),
  check: ({ authStore, type }) => ({
    tone: 'error',
    message: formatComposerSuspensionNotice(
      authStore.user,
      type === 'discussion' ? '暂时无法发布讨论。' : '暂时无法回复、编辑或上传附件。'
    ),
  }),
})

registerComposerSubmitGuard({
  key: 'discussion-start-permission',
  order: 20,
  isVisible: ({ type, mode }) => type === 'discussion' && mode === 'create',
  check: ({ authStore }) => {
    if (authStore?.canStartDiscussion) return null
    return {
      tone: 'error',
      message: '当前账号没有发起讨论的权限。',
    }
  },
})

registerComposerSubmitGuard({
  key: 'discussion-primary-tag',
  order: 30,
  isVisible: ({ type }) => type === 'discussion',
  check: ({ availablePrimaryTagCount, primaryTagId }) => {
    if (Number(availablePrimaryTagCount || 0) <= 0) {
      return {
        tone: 'error',
        message: '当前没有可用主标签，暂时无法发布讨论。',
      }
    }

    if (primaryTagId) return null
    return {
      tone: 'error',
      message: '请选择主标签后再发布讨论。',
    }
  },
})

registerComposerSecondaryAction({
  key: 'clear-discussion-draft',
  order: 10,
  isVisible: ({ type, isEditing, hasDraftContent }) => type === 'discussion' && !isEditing && Boolean(hasDraftContent),
  resolve: ({ draftSavedAt }) => ({
    label: '清除草稿',
    action: 'clear-draft',
    confirm: draftSavedAt ? {
      title: '清除讨论草稿',
      message: '确定要清除当前讨论草稿吗？',
      confirmText: '清除草稿',
      cancelText: '取消',
      tone: 'danger',
    } : null,
  }),
})

registerComposerSecondaryAction({
  key: 'clear-post-draft',
  order: 10,
  isVisible: ({ type, isEditing, hasDraftContent }) => type === 'post' && !isEditing && Boolean(hasDraftContent),
  resolve: ({ draftSavedAt }) => ({
    label: '清除草稿',
    action: 'clear-draft',
    confirm: draftSavedAt ? {
      title: '清除回复草稿',
      message: '确定要清除当前回复草稿吗？',
      confirmText: '清除草稿',
      cancelText: '取消',
      tone: 'danger',
    } : null,
  }),
})

registerComposerSecondaryAction({
  key: 'cancel-post-edit',
  order: 20,
  isVisible: ({ type, isEditing }) => type === 'post' && Boolean(isEditing),
  resolve: () => ({
    label: '取消编辑',
    action: 'cancel-edit',
    confirm: {
      title: '取消编辑',
      message: '确定放弃当前回复编辑内容吗？未保存修改将丢失。',
      confirmText: '放弃修改',
      cancelText: '继续编辑',
      tone: 'warning',
    },
  }),
})

registerComposerSecondaryAction({
  key: 'save-discussion-draft',
  order: 5,
  isVisible: ({ type, isEditing, hasDraftContent, submitting, uploading }) => {
    return type === 'discussion' && !isEditing && Boolean(hasDraftContent) && !submitting && !uploading
  },
  resolve: () => ({
    label: '保存草稿',
    onClick: async ({ composerStore }) => {
      window.dispatchEvent(new CustomEvent('bias:composer-save-request', {
        detail: {
          composerType: 'discussion',
          requestId: composerStore?.current?.requestId || 0,
        },
      }))
    },
  }),
})

registerComposerSecondaryAction({
  key: 'save-post-draft',
  order: 5,
  isVisible: ({ type, isEditing, hasDraftContent, submitting, uploading }) => {
    return type === 'post' && !isEditing && Boolean(hasDraftContent) && !submitting && !uploading
  },
  resolve: () => ({
    label: '保存草稿',
    onClick: async ({ composerStore }) => {
      window.dispatchEvent(new CustomEvent('bias:composer-save-request', {
        detail: {
          composerType: 'post',
          requestId: composerStore?.current?.requestId || 0,
        },
      }))
    },
  }),
})

registerComposerStatusItem({
  key: 'discussion-selected-tag',
  order: 10,
  isVisible: ({ type, selectedTagLabel, minimized }) => type === 'discussion' && Boolean(selectedTagLabel) && !minimized,
  resolve: ({ selectedTagLabel }) => ({
    label: '标签',
    value: selectedTagLabel,
  }),
})

registerComposerStatusItem({
  key: 'discussion-editing',
  order: 20,
  isVisible: ({ type, isEditing, minimized }) => type === 'discussion' && Boolean(isEditing) && !minimized,
  resolve: () => ({
    label: '状态',
    value: '编辑讨论',
  }),
})

registerComposerStatusItem({
  key: 'discussion-draft-saved-at',
  order: 30,
  isVisible: ({ type, draftSavedAt, minimized }) => type === 'discussion' && Boolean(draftSavedAt) && !minimized,
  resolve: ({ draftSavedAt, formatDraftTime }) => ({
    label: '草稿',
    value: `保存于 ${formatDraftTime?.(draftSavedAt) || draftSavedAt}`,
  }),
})

registerComposerStatusItem({
  key: 'post-editing',
  order: 10,
  isVisible: ({ type, isEditing, minimized }) => type === 'post' && Boolean(isEditing) && !minimized,
  resolve: ({ postNumber }) => ({
    label: '状态',
    value: postNumber ? `编辑 #${postNumber}` : '编辑回复',
  }),
})

registerComposerStatusItem({
  key: 'post-target',
  order: 20,
  isVisible: ({ type, discussionTitle, minimized }) => type === 'post' && Boolean(discussionTitle) && !minimized,
  resolve: ({ discussionTitle, username }) => ({
    label: '讨论',
    value: username ? `${discussionTitle} · @${username}` : discussionTitle,
  }),
})

registerComposerStatusItem({
  key: 'post-draft-saved-at',
  order: 30,
  isVisible: ({ type, draftSavedAt, isEditing, minimized }) => {
    return type === 'post' && !isEditing && Boolean(draftSavedAt) && !minimized
  },
  resolve: ({ draftSavedAt, formatDraftTime }) => ({
    label: '草稿',
    value: `保存于 ${formatDraftTime?.(draftSavedAt) || draftSavedAt}`,
  }),
})
