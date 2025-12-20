const KEY = 'pending_shorten_v1'

export type PendingShorten = {
  originalUrl: string
  alias?: string
  expirationTime?: string
}

export const setPendingShorten = (data: PendingShorten) => {
  localStorage.setItem(KEY, JSON.stringify(data))
}

export const getPendingShorten = (): PendingShorten | null => {
  const raw = localStorage.getItem(KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as PendingShorten
  } catch {
    return null
  }
}

export const clearPendingShorten = () => {
  localStorage.removeItem(KEY)
}
