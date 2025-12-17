import { redis } from './redis'

export type CachedUrl = {
  originalUrl: string
  expirationTime?: string // ISO
}

const key = (shortCode: string) => `url:${shortCode}`

export async function cacheGet(shortCode: string): Promise<CachedUrl | null> {
  if (!redis) return null
  const raw = await redis.get(key(shortCode))
  if (!raw) return null

  try {
    return JSON.parse(raw) as CachedUrl
  } catch {
    await redis.del(key(shortCode))
    return null
  }
}

export async function cacheSet(
  shortCode: string,
  value: CachedUrl,
  ttlSeconds: number
): Promise<void> {
  if (!redis) return
  if (!Number.isFinite(ttlSeconds) || ttlSeconds <= 0) return
  await redis.setEx(key(shortCode), Math.floor(ttlSeconds), JSON.stringify(value))
}
