export function useStartDiscussionAction({
  authStore,
  composerStore,
  router
}) {
  function startDiscussion({
    redirectToLogin = true,
    source = 'unknown',
    tagId = ''
  } = {}) {
    if (!authStore.isAuthenticated) {
      if (redirectToLogin) {
        router.push('/login')
      }
      return false
    }

    if (!authStore.canStartDiscussion) return false

    composerStore.openDiscussionComposer({
      source,
      tagId
    })
    return true
  }

  return {
    startDiscussion
  }
}
