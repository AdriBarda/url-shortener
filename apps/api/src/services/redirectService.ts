import { findByShortCode } from '../repositories/urlRepository'
import { cacheGet, cacheSet } from '../urlCache'
import { GoneError, NotFoundError } from '../errors'

const DEFAULT_TTL_SECONDS = 60 * 60 * 24 // 24h
const MAX_TTL_SECONDS = 60 * 60 * 24 * 7 // 7d

const isDev = process.env.NODE_ENV !== 'production'

function devLog(message: string) {
  if (isDev) console.log(message)
}

function expirationMs(expirationTime?: string): number | null {
  if (!expirationTime) return null
  const ms = Date.parse(expirationTime)
  return Number.isNaN(ms) ? null : ms
}

function isExpired(expirationTime?: string): boolean {
  const exp = expirationMs(expirationTime)
  return exp !== null && Date.now() >= exp
}

function ttlSeconds(expirationTime?: string): number {
  const exp = expirationMs(expirationTime)
  if (exp === null) return DEFAULT_TTL_SECONDS

  const msLeft = exp - Date.now()
  if (msLeft <= 0) return 0

  return Math.min(MAX_TTL_SECONDS, Math.floor(msLeft / 1000))
}

export async function getRedirectLocation(shortCode: string): Promise<string> {
  const c0 = process.hrtime.bigint()
  const cached = await cacheGet(shortCode)
  const c1 = process.hrtime.bigint()

  if (cached) {
    devLog(`[cache] HIT ${shortCode} (${Number(c1 - c0) / 1e6}ms)`)
    if (isExpired(cached.expirationTime)) throw new GoneError()
    return cached.originalUrl
  }

  devLog(`[cache] MISS ${shortCode} (${Number(c1 - c0) / 1e6}ms)`)

  const t0 = process.hrtime.bigint()
  const url = await findByShortCode(shortCode)
  const t1 = process.hrtime.bigint()
  devLog(`DB lookup ms: ${Number(t1 - t0) / 1e6}`)

  if (!url) throw new NotFoundError()
  if (isExpired(url.expirationTime)) throw new GoneError()

  const ttl = ttlSeconds(url.expirationTime)
  if (ttl > 0) {
    await cacheSet(
      shortCode,
      {
        originalUrl: url.originalUrl,
        expirationTime: url.expirationTime ?? undefined
      },
      ttl
    )
  }

  return url.originalUrl
}
