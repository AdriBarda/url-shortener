import { redis } from '../redis'

export type SessionRecord = {
  userId: string
  email?: string
  avatarUrl?: string
  refreshToken: string
  expiresAt: number // epoch seconds
  createdAt: number
  lastSeenAt: number
  lastRefreshAt?: number
}

const key = (sid: string) => `sess:${sid}`

export async function setSession(sid: string, record: SessionRecord, ttlSeconds: number) {
  await redis.set(key(sid), JSON.stringify(record), { EX: ttlSeconds })
}

export async function getSession(sid: string): Promise<SessionRecord | null> {
  const raw = await redis.get(key(sid))
  if (!raw) return null
  try {
    return JSON.parse(raw) as SessionRecord
  } catch {
    await redis.del(key(sid))
    return null
  }
}

export async function deleteSession(sid: string) {
  await redis.del(key(sid))
}
