import type { CreateUrlRequest, CreateUrlResponse } from '@repo/shared'

const API_BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000').replace(/\/$/, '')

export class ApiError extends Error {
  public readonly status: number
  public readonly code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

type ApiErrorBody = {
  error?: string
  message?: string
  code?: string
}

const readErrorBody = async (res: Response): Promise<ApiErrorBody> => {
  try {
    return (await res.json()) as ApiErrorBody
  } catch {
    return {}
  }
}

export const createShortUrl = async (payload: CreateUrlRequest): Promise<CreateUrlResponse> => {
  const res = await fetch(`${API_BASE}/urls`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const body = await readErrorBody(res)
    const msg = body.message ?? body.error ?? `Request failed with ${res.status}`
    throw new ApiError(msg, res.status, body.code)
  }

  return (await res.json()) as CreateUrlResponse
}
