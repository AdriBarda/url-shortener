import type { Request, Response, NextFunction } from 'express'
import cookie from 'cookie'
import { createClient } from '@supabase/supabase-js'
import { UnauthorizedError, ServiceUnavailableError } from '../errors'
import { getSession, setSession, deleteSession } from '../repositories/sessionRepository'
import { SID_COOKIE, SID_TTL_SECONDS } from '../config/session'
import { decrypt, encrypt } from '../utils/crypto'

declare global {
  namespace Express {
    interface Request {
      auth?: { userId: string }
    }
  }
}

const nowSec = (): number => Math.floor(Date.now() / 1000)

const REFRESH_SKEW_SECONDS = 60

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
})

export const requireAuthSid = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const parsed = cookie.parse(req.headers.cookie ?? '')
    const sid = parsed[SID_COOKIE]
    if (!sid) return next(new UnauthorizedError())

    const record = await getSession(sid)
    if (!record) return next(new UnauthorizedError())

    if (record.expiresAt - nowSec() > REFRESH_SKEW_SECONDS) {
      req.auth = { userId: record.userId }
      return next()
    }

    let refreshToken: string
    try {
      refreshToken = decrypt(record.refreshToken)
    } catch {
      await deleteSession(sid)
      return next(new UnauthorizedError())
    }

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken
    })

    if (error || !data.session) {
      await deleteSession(sid)
      return next(new UnauthorizedError())
    }

    const s = data.session
    if (!s.refresh_token || !s.expires_at) {
      return next(new ServiceUnavailableError('Auth provider returned incomplete session'))
    }

    const updated = {
      userId: s.user.id,
      email: s.user.email,
      refreshToken: encrypt(s.refresh_token),
      expiresAt: s.expires_at,
      createdAt: record.createdAt,
      lastSeenAt: nowSec()
    }

    await setSession(sid, updated, SID_TTL_SECONDS)

    req.auth = { userId: s.user.id }
    return next()
  } catch {
    return next(new ServiceUnavailableError('Session store unavailable'))
  }
}
