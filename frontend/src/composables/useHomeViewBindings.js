import { computed } from 'vue'

export function createHomeViewBindings({
  authStore,
  browseDiscussionsText,
  handleStartDiscussion,
  heroDescriptionText,
  heroTitleText,
  registerAccountText,
  startDiscussionText,
}) {
  const heroBindings = computed(() => ({
    title: heroTitleText.value,
    description: heroDescriptionText.value,
    variant: 'default',
  }))

  const actionBindings = computed(() => ({
    authStore,
    browseDiscussionsText: browseDiscussionsText.value,
    canStartDiscussion: Boolean(authStore.canStartDiscussion),
    registerAccountText: registerAccountText.value,
    startDiscussionText: startDiscussionText.value,
  }))

  const actionEvents = {
    startDiscussion: handleStartDiscussion,
  }

  return {
    actionBindings,
    actionEvents,
    heroBindings,
  }
}

export function useHomeViewBindings(options) {
  return createHomeViewBindings(options)
}
