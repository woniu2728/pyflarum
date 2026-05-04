import {
  getDiscussionActions,
  getPostActions,
  registerDiscussionAction,
  registerPostAction,
} from '@/forum/frontendRegistry'

export function registerDiscussionMenuItem(factory) {
  return registerDiscussionAction({
    key: `legacy-discussion-action-${Date.now()}-${Math.random()}`,
    isVisible: context => Boolean(factory(context)),
    resolve: factory,
  })
}

export function registerPostMenuItem(factory) {
  return registerPostAction({
    key: `legacy-post-action-${Date.now()}-${Math.random()}`,
    isVisible: context => Boolean(factory(context)),
    resolve: factory,
  })
}

export function getDiscussionMenuItems(context) {
  return getDiscussionActions(context)
    .map(item => (typeof item.resolve === 'function' ? item.resolve(context) : item))
    .filter(Boolean)
    .sort((left, right) => (left.order || 100) - (right.order || 100))
}

export function getPostMenuItems(context) {
  return getPostActions(context)
    .map(item => (typeof item.resolve === 'function' ? item.resolve(context) : item))
    .filter(Boolean)
    .sort((left, right) => (left.order || 100) - (right.order || 100))
}

registerDiscussionAction({
  key: 'reply',
  order: 10,
  isVisible: ({ canReplyFromMenu }) => Boolean(canReplyFromMenu),
  resolve: ({ hasActiveComposer }) => ({
    key: 'reply',
    label: hasActiveComposer ? '继续回复' : '回复讨论',
    order: 10
  })
})

registerDiscussionAction({
  key: 'login',
  order: 10,
  isVisible: ({ canReplyFromMenu }) => !canReplyFromMenu,
  resolve: () => ({
    key: 'login',
    label: '登录后回复',
    order: 10
  })
})

registerDiscussionAction({
  key: 'toggle-subscription',
  order: 20,
  isVisible: ({ authStore, isSuspended }) => Boolean(authStore?.isAuthenticated) && !isSuspended,
  resolve: ({ togglingSubscription, discussion }) => ({
    key: 'toggle-subscription',
    label: togglingSubscription ? '提交中...' : (discussion.is_subscribed ? '取消关注' : '关注讨论'),
    order: 20
  })
})

registerDiscussionAction({
  key: 'edit',
  order: 30,
  isVisible: ({ canEditDiscussion }) => Boolean(canEditDiscussion),
  resolve: () => ({
    key: 'edit',
    label: '编辑讨论',
    order: 30
  })
})

registerDiscussionAction({
  key: 'toggle-pin',
  order: 40,
  isVisible: ({ canModerateDiscussionSettings }) => Boolean(canModerateDiscussionSettings),
  resolve: ({ discussion }) => ({
    key: 'toggle-pin',
    label: discussion.is_sticky ? '取消置顶' : '置顶讨论',
    order: 40
  })
})

registerDiscussionAction({
  key: 'toggle-lock',
  order: 50,
  isVisible: ({ canModerateDiscussionSettings }) => Boolean(canModerateDiscussionSettings),
  resolve: ({ discussion }) => ({
    key: 'toggle-lock',
    label: discussion.is_locked ? '解除锁定' : '锁定讨论',
    order: 50
  })
})

registerDiscussionAction({
  key: 'toggle-hide',
  order: 60,
  isVisible: ({ canModerateDiscussionSettings }) => Boolean(canModerateDiscussionSettings),
  resolve: ({ discussion }) => ({
    key: 'toggle-hide',
    label: discussion.is_hidden ? '恢复显示' : '隐藏讨论',
    order: 60
  })
})

registerDiscussionAction({
  key: 'delete',
  order: 70,
  isVisible: ({ canModerateDiscussionSettings }) => Boolean(canModerateDiscussionSettings),
  resolve: () => ({
    key: 'delete',
    label: '删除讨论',
    tone: 'danger',
    order: 70
  })
})

registerPostAction({
  key: 'edit-post',
  order: 10,
  isVisible: ({ post, canEditPost }) => Boolean(canEditPost(post)),
  resolve: () => ({
    key: 'edit-post',
    label: '编辑',
    order: 10
  })
})

registerPostAction({
  key: 'delete-post',
  order: 20,
  isVisible: ({ post, canDeletePost }) => Boolean(canDeletePost(post)),
  resolve: () => ({
    key: 'delete-post',
    label: '删除',
    tone: 'danger',
    order: 20
  })
})

registerPostAction({
  key: 'toggle-hide-post',
  order: 25,
  isVisible: ({ post, canModeratePostVisibility }) => Boolean(canModeratePostVisibility?.(post)),
  resolve: ({ post }) => ({
    key: 'toggle-hide-post',
    label: post.is_hidden ? '恢复显示' : '隐藏回复',
    order: 25
  })
})

registerPostAction({
  key: 'open-report-modal',
  order: 30,
  isVisible: ({ post, canReportPost }) => Boolean(canReportPost(post)),
  resolve: () => ({
    key: 'open-report-modal',
    label: '举报',
    order: 30
  })
})
