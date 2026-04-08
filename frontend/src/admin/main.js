import { createApp } from 'vue'
import { createPinia } from 'pinia'
import AdminApp from './AdminApp.vue'
import router from './router'

const app = createApp(AdminApp)
const pinia = createPinia()

app.use(pinia)
app.use(router)

app.mount('#app')
