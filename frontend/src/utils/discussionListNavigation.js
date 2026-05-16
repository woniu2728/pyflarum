export function buildDiscussionFilterLocation(filterItem) {
  const filterCode = filterItem?.code
  const routePath = String(filterItem?.route_path || '').trim()

  if (routePath && routePath !== '/') {
    return routePath
  }

  if (filterCode === 'all') {
    return '/'
  }

  return {
    path: '/',
    query: {
      filter: filterCode,
    },
  }
}

export function isDiscussionFilterActive({
  currentTagSlug,
  routeName,
  isFollowingPage,
  listFilter,
  filterCode,
}) {
  if (currentTagSlug || routeName === 'tags') {
    return false
  }

  if (filterCode === 'following') {
    return Boolean(isFollowingPage)
  }

  if (routeName !== 'home') {
    return false
  }

  return listFilter === filterCode
}

export function normalizeDiscussionTagPosition(position) {
  return position === null || position === undefined ? null : Number(position)
}

export function sortDiscussionListSidebarTags(normalizedTags = []) {
  const tagsById = new Map(normalizedTags.map(tag => [tag.id, tag]))

  return normalizedTags.slice().sort((left, right) => {
    const leftPosition = normalizeDiscussionTagPosition(left.position)
    const rightPosition = normalizeDiscussionTagPosition(right.position)

    if (leftPosition === null && rightPosition === null) {
      return Number(right.discussion_count || 0) - Number(left.discussion_count || 0)
    }

    if (rightPosition === null) return -1
    if (leftPosition === null) return 1

    const leftParent = left.parent_id ? tagsById.get(left.parent_id) : null
    const rightParent = right.parent_id ? tagsById.get(right.parent_id) : null

    if (leftParent?.id === rightParent?.id) return leftPosition - rightPosition

    if (leftParent && rightParent) {
      return normalizeDiscussionTagPosition(leftParent.position) - normalizeDiscussionTagPosition(rightParent.position)
    }

    if (leftParent) {
      return leftParent.id === right.id
        ? 1
        : normalizeDiscussionTagPosition(leftParent.position) - rightPosition
    }

    if (rightParent) {
      return rightParent.id === left.id
        ? -1
        : leftPosition - normalizeDiscussionTagPosition(rightParent.position)
    }

    return 0
  })
}

export function findDiscussionListSidebarContextParent(targetSlug, normalizedTags = []) {
  if (!targetSlug) return null

  for (const tag of normalizedTags) {
    if (tag.slug === targetSlug) return tag

    const children = Array.isArray(tag.children) ? tag.children : []
    if (children.some(child => child.slug === targetSlug)) {
      return tag
    }
  }

  return null
}

export function buildDiscussionListPrimaryTagItems(flatTags = [], contextParent = null) {
  return sortDiscussionListSidebarTags(flatTags).filter(tag => {
    const position = normalizeDiscussionTagPosition(tag.position)
    if (position === null) return false
    if (!tag.parent_id) return true
    return Boolean(contextParent && tag.parent_id === contextParent.id)
  })
}

export function buildDiscussionListSecondaryTagItems(flatTags = []) {
  return sortDiscussionListSidebarTags(flatTags)
    .filter(tag => normalizeDiscussionTagPosition(tag.position) === null)
    .slice(0, 3)
}

export function getDiscussionListContrastColor(color) {
  const hex = String(color || '').trim().replace('#', '')
  if (!/^[\da-fA-F]{6}$/.test(hex)) return '#ffffff'

  const red = parseInt(hex.slice(0, 2), 16)
  const green = parseInt(hex.slice(2, 4), 16)
  const blue = parseInt(hex.slice(4, 6), 16)
  const brightness = (red * 299 + green * 587 + blue * 114) / 1000

  return brightness >= 150 ? '#243447' : '#ffffff'
}

export function getDiscussionListStartButtonStyle(tag) {
  if (!tag?.color) return {}

  return {
    '--tag-button-bg': tag.color,
    '--tag-button-text': getDiscussionListContrastColor(tag.color),
  }
}

export function isDiscussionSidebarTagActive({
  currentTag,
  currentTagSlug,
  normalizedTags,
  tag,
}) {
  if (currentTagSlug === tag.slug) return true

  const parent = findDiscussionListSidebarContextParent(currentTagSlug, normalizedTags)
  return Boolean(currentTag?.parent_id && parent?.slug === tag.slug)
}
