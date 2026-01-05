import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/pages/HomeView.vue'
import DashboardView from '@/pages/DashboardView.vue'
import UrlDetailsView from '@/pages/UrlDetailsView.vue'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../pages/AboutView.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/pages/LoginView.vue'),
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
      meta: { requiresAuth: true },
    },
    {
      path: '/dashboard/urls/:shortCode',
      name: 'url-details',
      component: UrlDetailsView,
      meta: { requiresAuth: true },
    },
  ],
})

let authReady: Promise<void> | null = null

router.beforeEach(async (to) => {
  const authStore = useAuthStore()
  if (!authReady) {
    authReady = authStore.initAuth()
  }
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

export default router
