export type Provider = 'github'

type Me = {
  userId: string
  email: string | undefined
  avatarUrl?: string
}

const API = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000').replace(/\/$/, '')

export async function fetchMe(): Promise<Me | null> {
  const res = await fetch(`${API}/auth/me`, { credentials: 'include' })
  if (!res.ok) return null
  return (await res.json()) as Me
}

export function startOAuth(provider: Provider, next = '/dashboard') {
  if (provider !== 'github') throw new Error('Unsupported provider')
  window.location.href = `${API}/auth/github/start?next=${encodeURIComponent(next)}`
}

export async function logout() {
  await fetch(`${API}/auth/logout`, { method: 'POST', credentials: 'include' })
}

export type { Me }
