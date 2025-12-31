import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { fetchMe, logout, startOAuth, type Me, type Provider } from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  const me = ref<Me | null>(null)
  const ready = ref(false)
  let initPromise: Promise<void> | null = null

  const user = computed(() => me.value)
  const isAuthed = computed(() => !!me.value)

  const initAuth = async () => {
    if (ready.value) return

    if (initPromise) {
      await initPromise
      return
    }

    initPromise = (async () => {
      try {
        me.value = await fetchMe()
      } catch (error) {
        console.error('Failed to fetch auth state', error)
        me.value = null
      } finally {
        ready.value = true
        initPromise = null
      }
    })()

    await initPromise
  }

  const signInWithOAuth = (provider: Provider, next = '/dashboard') => {
    startOAuth(provider, next)
  }

  const signOut = async () => {
    await logout()
    me.value = null
  }

  return { user, ready, isAuthed, initAuth, signInWithOAuth, signOut }
})
