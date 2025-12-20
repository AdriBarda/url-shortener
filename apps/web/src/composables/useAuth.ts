import { supabase } from '@/lib/supabase'
import type { User, Session, Provider } from '@supabase/supabase-js'
import { computed, ref } from 'vue'

const session = ref<Session | null>(null)
const ready = ref(false)
let initialised = false

export const useAuth = () => {
  const user = computed<User | null>(() => session.value?.user ?? null)
  const isAuthed = computed(() => (user.value ? true : false))

  const initAuth = async () => {
    if (initialised) return
    initialised = true
    const { data } = await supabase.auth.getSession()
    session.value = data.session ?? null
    ready.value = true

    supabase.auth.onAuthStateChange((_event, newSession) => {
      session.value = newSession
    })
  }

  const signInWithOAuth = async (provider: Provider, next?: string) => {
    const redirectTo =
      `${window.location.origin}/auth/callback` + (next ? `?next=${encodeURIComponent(next)}` : '')

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
      },
    })
    if (error) throw error
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signUp = async (email: string, password: string, next?: string) => {
    const redirectTo =
      `${window.location.origin}/auth/callback` + (next ? `?next=${encodeURIComponent(next)}` : '')

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
      },
    })
    if (error) throw error
    return data
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const getAccessToken = async (): Promise<string | null> => {
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token ?? null
  }

  return {
    session,
    user,
    ready,
    isAuthed,
    initAuth,
    signInWithOAuth,
    signIn,
    signUp,
    signOut,
    getAccessToken,
  }
}
