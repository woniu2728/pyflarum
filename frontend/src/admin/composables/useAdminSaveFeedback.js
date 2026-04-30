import { onBeforeUnmount, ref } from 'vue'

export function useAdminSaveFeedback(hideDelay = 3000) {
  const saveSuccess = ref(false)
  const saveError = ref(false)
  let successTimer = null

  function clearSuccessTimer() {
    if (successTimer) {
      clearTimeout(successTimer)
      successTimer = null
    }
  }

  function resetSaveFeedback() {
    clearSuccessTimer()
    saveSuccess.value = false
    saveError.value = false
  }

  function showSaveSuccess() {
    clearSuccessTimer()
    saveSuccess.value = true
    saveError.value = false
    successTimer = setTimeout(() => {
      saveSuccess.value = false
      successTimer = null
    }, hideDelay)
  }

  function showSaveError() {
    clearSuccessTimer()
    saveSuccess.value = false
    saveError.value = true
  }

  onBeforeUnmount(() => {
    clearSuccessTimer()
  })

  return {
    saveSuccess,
    saveError,
    resetSaveFeedback,
    showSaveSuccess,
    showSaveError
  }
}
