import { computed, ref } from 'vue'

export type Provider = 'github'

type Me = {
  userId: string
  email: string | undefined
  avatarUrl?: string
}

const me = ref<Me | null>(null)
const ready = ref(false)
let initialised = false

const API = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000').replace(/\/$/, '')

async function fetchMe(): Promise<Me | null> {
  const res = await fetch(`${API}/auth/me`, { credentials: 'include' })
  if (!res.ok) return null
  return (await res.json()) as Me
}

export const useAuth = () => {
  const user = computed(() => me.value)
  const isAuthed = computed(() => !!me.value)

  const initAuth = async () => {
    if (initialised) return
    initialised = true
    me.value = await fetchMe()
    ready.value = true
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
}
