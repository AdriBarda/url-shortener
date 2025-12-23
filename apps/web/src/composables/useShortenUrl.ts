import { createShortUrl, ApiError } from '@/services/urlApi'
import type { CreateUrlRequest, CreateUrlResponse } from '@repo/shared'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { ref } from 'vue'

dayjs.extend(customParseFormat)

const normalizeExpiration = (value?: string): string | undefined => {
  if (!value || !value.trim()) return undefined

  const trimmed = value.trim()
  const hasZone = /[zZ]|[+-]\d\d:?\d\d$/.test(trimmed)

  if (hasZone) {
    const parsed = dayjs(trimmed)
    if (!parsed.isValid()) throw new Error('Invalid expiration date')
    return parsed.toISOString()
  }

  const parsed = dayjs(trimmed, ['YYYY-MM-DDTHH:mm', 'YYYY-MM-DDTHH:mm:ss'], true)
  if (!parsed.isValid()) throw new Error('Invalid expiration date')

  return parsed.toISOString()
}

const toUiMessage = (err: unknown): string => {
  if (err instanceof ApiError) {
    if (err.status === 400) return err.message
    if (err.status === 401) return 'Your session expired. Please sign in again.'
    if (err.status === 409) return 'That alias is already taken.'
    if (err.status >= 500) return 'Server error. Please try again.'
    return err.message
  }

  if (err instanceof Error) return err.message
  return 'Something went wrong. Please try again.'
}

type SubmitResult =
  | { ok: true; data: CreateUrlResponse }
  | { ok: false; reason: 'unauthorized' }

export const useShortenUrl = () => {
  const loading = ref<boolean>(false)
  const error = ref<string | null>(null)
  const result = ref<CreateUrlResponse | null>(null)

  const submit = async (payload: CreateUrlRequest): Promise<SubmitResult> => {
    loading.value = true
    error.value = null
    result.value = null

    try {
      const cleanPayload: CreateUrlRequest = {
        originalUrl: payload.originalUrl.trim(),
      }

      if (payload.alias?.trim()) cleanPayload.alias = payload.alias.trim()

      if (payload.expirationTime?.trim()) {
        cleanPayload.expirationTime = normalizeExpiration(payload.expirationTime)
      }

      const res = await createShortUrl(cleanPayload)
      result.value = res
      return { ok: true, data: res }
    } catch (err: unknown) {
      error.value = toUiMessage(err)

      if (err instanceof ApiError && err.status === 401) {
        return { ok: false, reason: 'unauthorized' }
      }

      throw err
    } finally {
      loading.value = false
    }
  }

  const reset = (): void => {
    loading.value = false
    error.value = null
    result.value = null
  }

  return { loading, error, result, submit, reset }
}
