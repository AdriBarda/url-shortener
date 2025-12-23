import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

const authStore = useAuthStore(pinia)
const authReady = authStore.initAuth()

router.beforeEach(async (to) => {
  await authReady

  if (to.name === 'login' && authStore.isAuthed) {
    const next = (to.query.next as string) || '/dashboard'
    return next
  }

  if (to.meta.requiresAuth && !authStore.isAuthed) {
    return { name: 'login', query: { next: to.fullPath } }
  }

  return true
})

app.use(router)

app.mount('#app')
