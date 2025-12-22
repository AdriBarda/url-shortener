import { createShortUrl, ApiError } from '@/services/urlApi'
import type { CreateUrlRequest, CreateUrlResponse } from '@repo/shared'
import { ref } from 'vue'

const datetimeLocalToIso = (value: string): string => {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value)
  if (!match) throw new Error('Invalid expiration date')

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const hour = Number(match[4])
  const minute = Number(match[5])

  const localDate = new Date(year, month - 1, day, hour, minute, 0, 0)
  if (Number.isNaN(localDate.getTime())) throw new Error('Invalid expiration date')

  return localDate.toISOString()
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
        cleanPayload.expirationTime = datetimeLocalToIso(payload.expirationTime.trim())
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
