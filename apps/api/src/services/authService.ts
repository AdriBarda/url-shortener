import type { Request, Response } from 'express'
import crypto from 'crypto'
import cookie from 'cookie'
import { createSsrSupabaseClient } from '../utils/supabaseSsr'
import { setSession, getSession, deleteSession } from '../repositories/sessionRepository'
import {
  MAX_SESSION_AGE_SECONDS,
  REFRESH_COOLDOWN_SECONDS,
  REFRESH_WINDOW_SECONDS,
  SID_COOKIE,
  SID_TTL_SECONDS,
  sidCookieOptions
} from '../config/session'
import { ValidationError, UnauthorizedError, ServiceUnavailableError } from '../errors'
import { encrypt, decrypt } from '../utils/crypto'
import { createClient } from '@supabase/supabase-js'
import { scheduleSessionRefresh } from './sessionRefreshService'

const nowSec = (): number => Math.floor(Date.now() / 1000)

function safeNext(next: unknown) {
  if (typeof next !== 'string') return '/dashboard'
  return next.startsWith('/') ? next : '/dashboard'
}

export async function startGithubOAuth(args: { req: Request; res: Response; nextPath: unknown }) {
  const { req, res, nextPath } = args
  const supabase = createSsrSupabaseClient(req, res)

  const next = safeNext(nextPath)

  const redirectTo =
    `${process.env.BASE_SHORT_URL}/auth/callback` + `?next=${encodeURIComponent(next)}`

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo,
      scopes: 'user:email'
    }
  })

  if (error) {
    throw new ValidationError(error.message)
  }

  if (!data?.url) {
    throw new ServiceUnavailableError('OAuth provider unavailable')
  }

  return { url: data.url }
}

export const handleOAuthCallback = async (args: {
  req: Request
  res: Response
  code: unknown
  nextPath: unknown
}): Promise<string> => {
  const { req, res, code, nextPath } = args
  const next = safeNext(nextPath)

  if (typeof code !== 'string') {
    return next
  }

  const supabase = createSsrSupabaseClient(req, res)

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    throw new ValidationError(error.message)
  }

  const session = data.session
  if (!session) {
    throw new UnauthorizedError()
  }

  const sid = crypto.randomUUID()
  const now = nowSec()

  if (!session.refresh_token || !session.expires_at) {
    throw new ServiceUnavailableError('Missing session tokens from auth provider')
  }

  const refreshTokenEnc = encrypt(session.refresh_token)

  try {
    await setSession(
      sid,
      {
        userId: session.user.id,
        email: session.user.email ?? undefined,
        avatarUrl: session.user.user_metadata?.avatar_url ?? undefined,
        refreshToken: refreshTokenEnc,
        expiresAt: session.expires_at,
        createdAt: now,
        lastSeenAt: now,
        lastRefreshAt: now
      },
      SID_TTL_SECONDS
    )
  } catch {
    throw new ServiceUnavailableError('Session store unavailable')
  }

  res.append(
    'Set-Cookie',
    cookie.serialize(SID_COOKIE, sid, { ...sidCookieOptions(), maxAge: SID_TTL_SECONDS })
  )

  return next
}

export async function getMe(req: Request): Promise<{
  me: { userId: string; email?: string; avatarUrl?: string }
}> {
  const parsed = cookie.parse(req.headers.cookie ?? '')
  const sid = parsed[SID_COOKIE]
  if (!sid) {
    throw new UnauthorizedError()
  }

  const record = await getSession(sid)
  if (!record) {
    throw new UnauthorizedError()
  }
  const now = nowSec()
  if (now - record.createdAt > MAX_SESSION_AGE_SECONDS) {
    await deleteSession(sid)
    throw new UnauthorizedError()
  }

  const lastRefreshAt = record.lastRefreshAt ?? record.createdAt
  const refreshNeeded =
    record.expiresAt - now <= REFRESH_WINDOW_SECONDS &&
    now - lastRefreshAt >= REFRESH_COOLDOWN_SECONDS
  if (refreshNeeded) {
    await scheduleSessionRefresh(sid, record)
  }
  return {
    me: { userId: record.userId, email: record.email, avatarUrl: record.avatarUrl }
  }
}

const supabaseAnon = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
})

export async function logout(req: Request, res: Response) {
  const parsed = cookie.parse(req.headers.cookie ?? '')
  const sid = parsed[SID_COOKIE]

  res.append('Set-Cookie', cookie.serialize(SID_COOKIE, '', { ...sidCookieOptions(), maxAge: 0 }))

  Object.keys(parsed)
    .filter((name) => name.startsWith('sb-'))
    .forEach((name) => {
      res.append('Set-Cookie', cookie.serialize(name, '', { path: '/', maxAge: 0 }))
    })

  if (!sid) return

  let record
  try {
    record = await getSession(sid)
    await deleteSession(sid)
  } catch {
    throw new ServiceUnavailableError('Session store unavailable')
  }

  if (!record?.refreshToken) return

  try {
    const refreshToken = decrypt(record.refreshToken)

    const { data, error } = await supabaseAnon.auth.refreshSession({
      refresh_token: refreshToken
    })

    const accessToken = data.session?.access_token

    if (!error && accessToken) {
      await fetch(`${process.env.SUPABASE_URL}/auth/v1/logout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          apikey: process.env.SUPABASE_ANON_KEY!
        }
      })
    }
  } catch {
    // Local session has already been cleared. Best-effort Supabase logout.
  }
}
