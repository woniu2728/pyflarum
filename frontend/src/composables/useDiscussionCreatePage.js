import { onMounted } from 'vue'

export function useDiscussionCreatePage({
  route,
  router,
  startDiscussion,
}) {
  function resolveTagId() {
    return typeof route.query.tag === 'string' ? route.query.tag : ''
  }

  function resolveReturnTo() {
    return typeof route.query.returnTo === 'string' ? route.query.returnTo : '/'
  }

  onMounted(() => {
    startDiscussion({
      redirectToLogin: true,
      source: 'route',
      tagId: resolveTagId(),
    })
    router.replace(resolveReturnTo())
  })

  return {
    resolveReturnTo,
    resolveTagId,
  }
}
