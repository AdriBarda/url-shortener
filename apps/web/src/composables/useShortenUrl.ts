import { createShortUrl } from '@/services/urlApi'
import type { CreateUrlResponse, CreateUrlRequest } from '@repo/shared'
import { ref } from 'vue'

export const useShortenUrl = () => {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const result = ref<CreateUrlResponse | null>(null)

  const submit = async (payload: CreateUrlRequest) => {
    loading.value = true
    error.value = null
    result.value = null
    try {
      const payloadCopy = { ...payload }

      payloadCopy.alias = payloadCopy.alias?.trim() || undefined
      payloadCopy.expirationTime = payloadCopy.expirationTime?.trim() || undefined

      if (payloadCopy.expirationTime) {
        payloadCopy.expirationTime = new Date(payloadCopy.expirationTime).toISOString()
      }

      const res = await createShortUrl(payloadCopy)
      result.value = res
      return res
    } catch (e) {
      error.value = e instanceof Error ? e.message || 'Error' : 'Unknown error'
      throw e
    } finally {
      loading.value = false
    }
  }

  const reset = () => {
    loading.value = false
    error.value = null
    result.value = null
  }

  return { loading, error, result, submit, reset }
}
