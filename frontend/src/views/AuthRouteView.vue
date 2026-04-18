<template>
  <div class="AuthRouteView" aria-hidden="true"></div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { openForgotPasswordModal, openLoginModal, openRegisterModal } from '@/utils/authModal'

const route = useRoute()
const router = useRouter()

onMounted(() => {
  const redirectPath = typeof route.query.redirect === 'string' ? route.query.redirect : '/'

  if (route.name === 'register') {
    openRegisterModal({ redirectPath })
  } else if (route.name === 'forgot-password') {
    openForgotPasswordModal({ redirectPath })
  } else {
    openLoginModal({ redirectPath })
  }

  router.replace('/')
})
</script>
