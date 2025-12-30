import { createClient } from '@supabase/supabase-js'
import { redis } from '../redis'
import { deleteSession, setSession } from '../repositories/sessionRepository'
import { SID_TTL_SECONDS } from '../config/session'
import { decrypt, encrypt } from '../utils/crypto'
import type { SessionRecord } from '../repositories/sessionRepository'

const nowSec = (): number => Math.floor(Date.now() / 1000)

const supabaseAnon = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
})

const refreshLockKey = (sid: string) => `sess:refresh:${sid}`

export async function scheduleSessionRefresh(sid: string, record: SessionRecord): Promise<boolean> {
  const lock = await redis.set(refreshLockKey(sid), '1', { NX: true, EX: 60 })
  if (!lock) return false

  console.log('[auth] session refresh scheduled', { sid, expiresAt: record.expiresAt })

  setImmediate(async () => {
    try {
      let refreshToken: string
      try {
        refreshToken = decrypt(record.refreshToken)
      } catch {
        await deleteSession(sid)
        return
      }

      const { data, error } = await supabaseAnon.auth.refreshSession({
        refresh_token: refreshToken
      })

      if (error || !data.session) {
        await deleteSession(sid)
        return
      }

      const session = data.session
      if (!session.refresh_token || !session.expires_at) {
        await deleteSession(sid)
        return
      }

      const now = nowSec()
      const updated: SessionRecord = {
        userId: session.user.id,
        email: session.user.email ?? undefined,
        avatarUrl: session.user.user_metadata?.avatar_url ?? undefined,
        refreshToken: encrypt(session.refresh_token),
        expiresAt: session.expires_at,
        createdAt: record.createdAt,
        lastSeenAt: now,
        lastRefreshAt: now
      }

      await setSession(sid, updated, SID_TTL_SECONDS)
      console.log('[auth] session refresh completed', { sid, expiresAt: session.expires_at })
    } finally {
      await redis.del(refreshLockKey(sid))
    }
  })

  return true
}
