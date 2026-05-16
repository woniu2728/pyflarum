export function resolveDiscussionListActiveFilterCode({ isFollowingPage, listFilter }) {
  return isFollowingPage ? 'following' : String(listFilter || 'all')
}

export function getDiscussionListFilterLabelText(filterCode) {
  switch (String(filterCode || 'all').trim()) {
    case 'following':
      return '关注中'
    case 'unread':
      return '未读'
    case 'my':
      return '我的讨论'
    default:
      return '全部讨论'
  }
}

export function getDiscussionListFilterHeroTitleText(filterCode) {
  switch (String(filterCode || 'all').trim()) {
    case 'following':
      return '关注的讨论'
    case 'unread':
      return '未读讨论'
    case 'my':
      return '我的讨论'
    default:
      return '全部讨论'
  }
}

export function getDiscussionListFilterHeroDescriptionText(filterCode) {
  switch (String(filterCode || 'all').trim()) {
    case 'following':
      return '这里会显示你已关注、并在后续收到新回复通知的讨论。'
    case 'unread':
      return '这里会集中显示你仍有未读回复的讨论，方便继续跟进。'
    case 'my':
      return '这里会集中展示你发起过的讨论与最近互动。'
    default:
      return '浏览论坛最新讨论、热门主题和社区回复。'
  }
}

export function resolveDiscussionListPageMetaTitle({
  filterCode,
  currentTagName,
  searchQuery,
}) {
  const search = String(searchQuery || '').trim()
  const baseTitle = currentTagName || getDiscussionListFilterHeroTitleText(filterCode)

  return search ? `${baseTitle} - 搜索“${search}”` : baseTitle
}

export function resolveDiscussionListPageMetaDescription({
  filterCode,
  currentTagName,
  currentTagDescription,
  searchQuery,
}) {
  const search = String(searchQuery || '').trim()
  const tagName = String(currentTagName || '').trim()
  const tagDescription = String(currentTagDescription || '').trim()

  if (tagName) {
    if (search) {
      return `查看标签“${tagName}”下与“${search}”相关的讨论。`
    }

    return tagDescription || `查看标签“${tagName}”下的最新讨论和回复。`
  }

  if (search) {
    return `在${getDiscussionListFilterLabelText(filterCode)}中搜索与“${search}”相关的讨论。`
  }

  switch (String(filterCode || 'all').trim()) {
    case 'following':
      return '查看你关注的讨论和最新回复。'
    case 'unread':
      return '集中查看你还有未读回复的讨论。'
    case 'my':
      return '集中查看你发起过的讨论与最新互动。'
    default:
      return '浏览论坛最新讨论、热门主题和社区回复。'
  }
}
