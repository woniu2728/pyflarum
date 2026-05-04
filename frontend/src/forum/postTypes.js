import DiscussionPostItem from '@/components/discussion/DiscussionPostItem.vue'
import DiscussionLockedPostItem from '@/components/discussion/DiscussionLockedPostItem.vue'
import DiscussionRenamedPostItem from '@/components/discussion/DiscussionRenamedPostItem.vue'
import DiscussionHiddenPostItem from '@/components/discussion/DiscussionHiddenPostItem.vue'
import DiscussionStickyPostItem from '@/components/discussion/DiscussionStickyPostItem.vue'
import DiscussionTaggedPostItem from '@/components/discussion/DiscussionTaggedPostItem.vue'

const postTypeDefinitions = []
const postTypeComponents = {
  comment: DiscussionPostItem,
  discussionRenamed: DiscussionRenamedPostItem,
  discussionLocked: DiscussionLockedPostItem,
  discussionSticky: DiscussionStickyPostItem,
  discussionTagged: DiscussionTaggedPostItem,
  discussionHidden: DiscussionHiddenPostItem
}

export function registerPostType(definition) {
  const normalizedDefinition = {
    order: 100,
    ...definition
  }

  const existingIndex = postTypeDefinitions.findIndex(item => item.type === normalizedDefinition.type)
  if (existingIndex >= 0) {
    postTypeDefinitions.splice(existingIndex, 1, normalizedDefinition)
    return normalizedDefinition
  }

  postTypeDefinitions.push(normalizedDefinition)
  return normalizedDefinition
}

export function getPostTypeDefinition(type) {
  const normalizedType = String(type || 'comment')
  const exactMatch = postTypeDefinitions.find(item => item.type === normalizedType)
  if (exactMatch) {
    return exactMatch
  }

  return (
    postTypeDefinitions.find(item => item.isDefault)
    || postTypeDefinitions[0]
    || null
  )
}

export function syncPostTypes(definitions = []) {
  definitions.forEach((definition, index) => {
    const type = String(definition?.code || definition?.type || '')
    if (!type) {
      return
    }

    registerPostType({
      ...definition,
      type,
      component: postTypeComponents[type] || DiscussionPostItem,
      isDefault: Boolean(definition?.is_default ?? definition?.isDefault),
      order: Number(definition?.order ?? ((index + 1) * 10))
    })
  })
}

syncPostTypes([
  {
    code: 'comment',
    label: '普通回复',
    is_default: true,
    order: 10
  },
  {
    code: 'discussionRenamed',
    label: '讨论改标题',
    order: 20
  },
  {
    code: 'discussionLocked',
    label: '讨论锁定状态变更',
    order: 30
  },
  {
    code: 'discussionSticky',
    label: '讨论置顶状态变更',
    order: 40
  },
  {
    code: 'discussionTagged',
    label: '讨论标签变更',
    order: 50
  },
  {
    code: 'discussionHidden',
    label: '讨论隐藏状态变更',
    order: 60
  }
])
