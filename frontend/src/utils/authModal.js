import AuthSessionModal from '@/components/modals/AuthSessionModal.vue'
import { useModalStore } from '@/stores/modal'

function sanitizeRedirectPath(value) {
  const fallback = '/'
  const redirect = String(value || '').trim()

  if (!redirect || !redirect.startsWith('/')) {
    return fallback
  }

  if (['/login', '/register', '/forgot-password'].includes(redirect)) {
    return fallback
  }

  return redirect
}

function showAuthModal(mode, options = {}) {
  const modalStore = useModalStore()

  return modalStore.show(
    AuthSessionModal,
    {
      mode,
      redirectPath: sanitizeRedirectPath(options.redirectPath),
      initialIdentification: options.initialIdentification || '',
      initialEmail: options.initialEmail || '',
      initialUsername: options.initialUsername || '',
      initialPassword: options.initialPassword || ''
    },
    {
      dismissibleViaCloseButton: true,
      dismissibleViaEscKey: true,
      dismissibleViaBackdropClick: true
    }
  )
}

export function openLoginModal(options = {}) {
  return showAuthModal('login', options)
}

export function openRegisterModal(options = {}) {
  return showAuthModal('register', options)
}

export function openForgotPasswordModal(options = {}) {
  return showAuthModal('forgot-password', options)
}

export { sanitizeRedirectPath }
