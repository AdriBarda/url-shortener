import type { Request, Response, NextFunction } from 'express'
import cookie from 'cookie'
import { UnauthorizedError, ServiceUnavailableError } from '../errors'
import { getSession, deleteSession } from '../repositories/sessionRepository'
import {
  MAX_SESSION_AGE_SECONDS,
  REFRESH_COOLDOWN_SECONDS,
  REFRESH_GRACE_SECONDS,
  REFRESH_WINDOW_SECONDS,
  SID_COOKIE
} from '../config/session'
import { scheduleSessionRefresh } from '../services/sessionRefreshService'

const nowSec = (): number => Math.floor(Date.now() / 1000)

export const requireAuthSid = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = cookie.parse(req.headers.cookie ?? '')
    const sid = parsed[SID_COOKIE]
    if (!sid) return next(new UnauthorizedError())

    const record = await getSession(sid)
    if (!record) return next(new UnauthorizedError())

    const now = nowSec()
    if (now - record.createdAt > MAX_SESSION_AGE_SECONDS) {
      await deleteSession(sid)
      return next(new UnauthorizedError())
    }

    const secondsToExpiry = record.expiresAt - now
    const lastRefreshAt = record.lastRefreshAt ?? record.createdAt
    const cooldownElapsed = now - lastRefreshAt >= REFRESH_COOLDOWN_SECONDS
    if (secondsToExpiry <= REFRESH_WINDOW_SECONDS && cooldownElapsed) {
      await scheduleSessionRefresh(sid, record)
    }

    if (secondsToExpiry < -REFRESH_GRACE_SECONDS) {
      return next(new UnauthorizedError())
    }

    req.auth = { userId: record.userId }
    return next()
  } catch {
    return next(new ServiceUnavailableError('Session store unavailable'))
  }
}
