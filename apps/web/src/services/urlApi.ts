import type { CreateUrlRequest, CreateUrlResponse } from '@repo/shared'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export async function createShortUrl(
  payload: CreateUrlRequest,
  accessToken?: string,
): Promise<CreateUrlResponse> {
  const res = await fetch(`${API_BASE}/urls`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error ?? `Request failed with ${res.status}`)
  }

  return res.json() as Promise<CreateUrlResponse>
}
