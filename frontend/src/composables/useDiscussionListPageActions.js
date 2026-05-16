export function useDiscussionListPageActions({
  currentTag,
  route,
  startDiscussion,
}) {
  function handleStartDiscussion() {
    return startDiscussion({
      tagId: currentTag.value?.id,
      source: route.name?.toString() || 'index',
    })
  }

  return {
    handleStartDiscussion,
  }
}
