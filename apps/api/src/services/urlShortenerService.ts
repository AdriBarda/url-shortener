import type { CreateUrlRequest, CreateUrlResponse, UrlListItem } from '@repo/shared'
import { createUrlRequestSchema } from '@repo/shared'
import { ZodError } from 'zod'
import { validateAndNormalizeUrl } from '../utils/normalizeUrl'
import { isValidAlias } from '../utils/alias'
import { ConflictError, NotFoundError, ServiceUnavailableError, ValidationError } from '../errors'
import { genCode } from '../utils/shortCode'
import { createUrl, findByShortCodeForUser, findByUserId } from '../repositories/urlRepository'
import { isUniqueViolation } from '../db/isUniqueViolation'
import { getUrlStats } from '../repositories/clickRepository'

const BASE_SHORT_URL = process.env.BASE_SHORT_URL

if (!BASE_SHORT_URL) {
  throw new Error('BASE_SHORT_URL is not defined')
}

function parseExpiration(value: string): number {
  const hasZone = /[zZ]|[+-]\d\d:?\d\d$/.test(value)
  if (!hasZone) {
    throw new ValidationError('expirationTime must include a timezone (offset or Z)')
  }

  const ms = Date.parse(value)
  if (Number.isNaN(ms)) {
    throw new ValidationError('expirationTime must be a valid ISO datetime')
  }

  return ms
}

export async function createShortUrl(
  input: CreateUrlRequest,
  userId: string
): Promise<CreateUrlResponse> {
  let parsedInput: CreateUrlRequest
  try {
    parsedInput = createUrlRequestSchema.parse(input)
  } catch (err) {
    if (err instanceof ZodError) {
      const message = err.issues[0]?.message ?? 'Invalid input'
      throw new ValidationError(message)
    }
    throw err
  }
  const { originalUrl, alias, expirationTime: requestedExpiration } = parsedInput

  const cleanUrl = validateAndNormalizeUrl(originalUrl)

  let expirationTime: string | undefined = undefined

  if (requestedExpiration) {
    const ms = parseExpiration(requestedExpiration)

    if (ms <= Date.now()) {
      throw new ValidationError('expirationTime must be in the future')
    }
    expirationTime = new Date(ms).toISOString()
  }

  if (alias) {
    if (!isValidAlias(alias)) {
      throw new ValidationError('alias is invalid')
    }

    try {
      await createUrl({
        shortCode: alias,
        originalUrl: cleanUrl,
        expirationTime: expirationTime,
        userId
      })
    } catch (err) {
      if (isUniqueViolation(err)) throw new ConflictError('Alias already exists')
      throw err
    }

    return {
      shortUrl: `${BASE_SHORT_URL}/${alias}`,
      shortCode: alias,
      originalUrl: cleanUrl
    }
  }

  const MAX_RETRIES = 10

  for (let i = 0; i < MAX_RETRIES; i++) {
    const code = genCode(6)

    try {
      await createUrl({
        shortCode: code,
        originalUrl: cleanUrl,
        expirationTime: expirationTime,
        userId
      })

      return {
        shortCode: code,
        shortUrl: `${BASE_SHORT_URL}/${code}`,
        originalUrl: cleanUrl
      }
    } catch (err) {
      if (isUniqueViolation(err)) continue
      throw err
    }
  }

  throw new ServiceUnavailableError('Could not generate unique short code')
}

export async function getUserUrls(userId: string): Promise<UrlListItem[]> {
  return findByUserId(userId, { limit: 100 })
}

export async function getUrlStatsForUser(shortCode: string, userId: string) {
  const url = await findByShortCodeForUser(shortCode, userId)
  if (!url) {
    throw new NotFoundError()
  }

  const stats = await getUrlStats(shortCode)
  return {
    shortCode,
    totalClicks: stats.totalClicks,
    lastClickedAt: stats.lastClickedAt,
    clicksLast7Days: stats.clicksLast7Days
  }
}
