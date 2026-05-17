<template>
  <div class="AuthRouteView" aria-hidden="true"></div>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'
import { useAuthRoutePage } from '@/composables/useAuthRoutePage'
import { openForgotPasswordModal, openLoginModal, openRegisterModal, sanitizeRedirectPath } from '@/utils/authModal'

const route = useRoute()
const router = useRouter()

useAuthRoutePage({
  openForgotPassword: openForgotPasswordModal,
  openLogin: openLoginModal,
  openRegister: openRegisterModal,
  route,
  router,
  sanitizeRedirectPath,
})
</script>
