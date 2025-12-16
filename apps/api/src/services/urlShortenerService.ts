import type { CreateUrlRequest, CreateUrlResponse } from '@repo/shared'
import { validateAndNormalizeUrl } from '../utils/normalizeUrl'
import { isValidAlias } from '../utils/alias'
import { ConflictError, ServiceUnavailableError, ValidationError } from '../errors'
import { genCode } from '../utils/shortCode'
import { createUrl } from '../repositories/urlRepository'
import { isUniqueViolation } from '../db/isUniqueViolation'

const BASE_SHORT_URL = process.env.BASE_SHORT_URL

if (!BASE_SHORT_URL) {
  throw new Error('BASE_SHORT_URL is not defined')
}

export async function createShortUrl(input: CreateUrlRequest): Promise<CreateUrlResponse> {
  const cleanUrl = validateAndNormalizeUrl(input.originalUrl)

  let expirationTime: string | undefined = undefined

  if (input.expirationTime) {
    const ms = Date.parse(input.expirationTime)
    if (Number.isNaN(ms)) {
      throw new ValidationError('expirationTime must be a valid ISO datetime')
    }

    if (ms <= Date.now()) {
      throw new ValidationError('expirationTime must be in the future')
    }
    expirationTime = new Date(ms).toISOString()
  }

  if (input.alias) {
    if (!isValidAlias(input.alias)) {
      throw new ValidationError('alias is invalid')
    }

    try {
      await createUrl({
        shortCode: input.alias,
        originalUrl: cleanUrl,
        expirationTime: expirationTime
      })
    } catch (err) {
      if (isUniqueViolation(err)) throw new ConflictError('Alias already exists')
      throw err
    }

    return {
      shortUrl: `${BASE_SHORT_URL}/${input.alias}`,
      shortCode: input.alias,
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
        expirationTime: expirationTime
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
