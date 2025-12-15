import type { CreateUrlRequest, CreateUrlResponse } from '@repo/shared'
import { validateAndNormalizeUrl } from '../utils/normalizeUrl'
import { isValidAlias } from '../utils/alias'
import { ConflictError, ServiceUnavailableError, ValidationError } from '../errors'
import { urlStore } from '../store/urlStore'
import { genCode } from '../utils/shortCode'

const BASE_SHORT_URL = process.env.BASE_SHORT_URL

if (!BASE_SHORT_URL) {
  throw new Error('BASE_SHORT_URL is not defined')
}

export const createShortUrl = (input: CreateUrlRequest): CreateUrlResponse => {
  const cleanUrl = validateAndNormalizeUrl(input.originalUrl)

  if (!cleanUrl) {
    throw new ValidationError('originalUrl is not a valid http(s) url')
  }

  if (input.alias) {
    if (!isValidAlias(input.alias)) {
      throw new ValidationError('alias is invalid')
    }

    if (urlStore.has(input.alias)) {
      throw new ConflictError('alias already in use')
    }

    urlStore.set(input.alias, { originalUrl: cleanUrl, expirationTime: input.expirationTime })

    return {
      shortUrl: `${BASE_SHORT_URL}/${input.alias}`,
      shortCode: input.alias,
      originalUrl: cleanUrl
    }
  }

  let shortCode: string | null = null
  for (let i = 0; i < 10; i++) {
    const candidate = genCode(6)
    if (!urlStore.has(candidate)) {
      shortCode = candidate
      break
    }
  }

  if (!shortCode) throw new ServiceUnavailableError('could not allocate short code')

  urlStore.set(shortCode, { originalUrl: cleanUrl, expirationTime: input.expirationTime })

  return {
    shortUrl: `${BASE_SHORT_URL}/${shortCode}`,
    shortCode,
    originalUrl: cleanUrl
  }
}
