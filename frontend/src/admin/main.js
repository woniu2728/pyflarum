import { createApp } from 'vue'
import { createPinia } from 'pinia'
import AdminApp from './AdminApp.vue'
import router from './router'
import { useForumStore } from '../stores/forum'
import '@fortawesome/fontawesome-free/css/all.min.css'
import '../assets/main.css'

const app = createApp(AdminApp)
const pinia = createPinia()

app.use(pinia)
app.use(router)

useForumStore(pinia).initialize()

app.mount('#app')
