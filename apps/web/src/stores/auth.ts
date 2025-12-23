import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export type Provider = 'github'

type Me = {
  userId: string
  email: string | undefined
  avatarUrl?: string
}

const API = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000').replace(/\/$/, '')

async function fetchMe(): Promise<Me | null> {
  const res = await fetch(`${API}/auth/me`, { credentials: 'include' })
  if (!res.ok) return null
  return (await res.json()) as Me
}

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
    if (provider !== 'github') throw new Error('Unsupported provider')
    window.location.href = `${API}/auth/github/start?next=${encodeURIComponent(next)}`
  }

  const signOut = async () => {
    await fetch(`${API}/auth/logout`, { method: 'POST', credentials: 'include' })
    me.value = null
  }

  return { user, ready, isAuthed, initAuth, signInWithOAuth, signOut }
})
