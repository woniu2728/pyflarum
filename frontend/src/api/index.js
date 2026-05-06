import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
})

let refreshRequest = null

function clearStoredTokens() {
  const authStore = useAuthStore()
  authStore.setAccessToken(null)
}

function isAuthEndpoint(url = '') {
  return url.includes('/users/login')
    || url.includes('/users/logout')
    || url.includes('/users/token/refresh')
}

async function refreshAccessToken() {
  if (!refreshRequest) {
    refreshRequest = api.post('/users/token/refresh', null, {
      skipAuthRefresh: true,
      skipAuthInvalidation: true
    }).finally(() => {
      refreshRequest = null
    })
  }

  return refreshRequest
}

function notifyAuthInvalidated(error) {
  if (error.config?.skipAuthInvalidation) return

  if (typeof window !== 'undefined') {
    const requestUrl = String(error.config?.url || '')
    const isSessionProbe = requestUrl.includes('/users/me')
    const isAdminRuntime =
      window.location.pathname.startsWith('/admin')
      || window.location.pathname.endsWith('/admin.html')

    window.dispatchEvent(new CustomEvent('bias:auth-invalidated'))

    if (isAdminRuntime) {
      window.location.href = '/login'
    } else if (!isSessionProbe) {
      window.dispatchEvent(new CustomEvent('bias:auth-required', {
        detail: {
          redirect: `${window.location.pathname}${window.location.search}${window.location.hash}`
        }
      }))
    }
  }
}

// 请求拦截器
api.interceptors.request.use(
  config => {
    const authStore = useAuthStore()
    const token = authStore.accessToken
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  response => {
    return response.data
  },
  async error => {
    const originalRequest = error.config || {}
    const requestUrl = String(originalRequest.url || '')

    if (
      error.response?.status === 401
      && !originalRequest._retry
      && !originalRequest.skipAuthRefresh
      && !isAuthEndpoint(requestUrl)
    ) {
      originalRequest._retry = true

      try {
        const data = await refreshAccessToken()
        const authStore = useAuthStore()
        authStore.setAccessToken(data.access)

        originalRequest.headers = originalRequest.headers || {}
        originalRequest.headers.Authorization = `Bearer ${data.access}`
        return api(originalRequest)
      } catch (refreshError) {
        clearStoredTokens()
        notifyAuthInvalidated(error)
        return Promise.reject(refreshError)
      }
    }

    if (error.response?.status === 401) {
      clearStoredTokens()
      notifyAuthInvalidated(error)
    }

    return Promise.reject(error)
  }
)

export default api
