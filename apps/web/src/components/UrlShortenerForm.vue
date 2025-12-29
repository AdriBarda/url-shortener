<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import type { CreateUrlRequest } from '@repo/shared'
import AdvancedOptions from '@/components/AdvancedOptions.vue'
import { useShortenUrl } from '@/composables/useShortenUrl'
import { useRouter } from 'vue-router'
import { setPendingShorten } from '@/utils/pendingShorten'
import { useAuthStore } from '@/stores/auth'
import ShortenResultModal from '@/components/ShortenResultModal.vue'
import { aliasSchema, expirationSchema, originalUrlSchema } from '@repo/shared'

const router = useRouter()
const authStore = useAuthStore()
const { isAuthed } = storeToRefs(authStore)
const originalUrl = ref('')
const showAdvancedOptions = ref(false)
const urlAlias = ref('')
const expirationTime = ref('')
const showResultModal = ref(false)
const lastPayload = ref<CreateUrlRequest | null>(null)
const showValidation = ref(false)

const shortBaseUrl = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000').replace(/\/$/, '')

const { loading, error, result, submit, reset } = useShortenUrl()
const shortUrl = computed(() => result.value?.shortUrl ?? null)

const rawUrlError = computed(() => {
  const value = originalUrl.value.trim()
  const result = originalUrlSchema.safeParse(value)
  return result.success ? null : (result.error.issues[0]?.message ?? 'Enter a valid URL.')
})

const rawAliasError = computed(() => {
  const result = aliasSchema.safeParse(urlAlias.value)
  return result.success ? null : (result.error.issues[0]?.message ?? null)
})

const rawExpirationError = computed(() => {
  const result = expirationSchema.safeParse(expirationTime.value)
  return result.success ? null : (result.error.issues[0]?.message ?? null)
})

const shouldShowUrlError = computed(
  () => showValidation.value || Boolean(originalUrl.value.trim()),
)
const shouldShowAliasError = computed(() => showValidation.value || Boolean(urlAlias.value.trim()))
const shouldShowExpirationError = computed(
  () => showValidation.value || Boolean(expirationTime.value.trim()),
)

const urlError = computed(() => (shouldShowUrlError.value ? rawUrlError.value : null))
const aliasError = computed(() => (shouldShowAliasError.value ? rawAliasError.value : null))
const expirationError = computed(() =>
  shouldShowExpirationError.value ? rawExpirationError.value : null,
)

const validationMessages = computed(() => {
  if (!shouldShowUrlError.value) return []
  return rawUrlError.value ? [rawUrlError.value] : []
})

const canSubmit = computed(() => !loading.value)

const redirectToLogin = async () =>
  router.push({
    name: 'login',
    query: { next: '/dashboard' },
  })

const onSubmit = async () => {
  showValidation.value = true
  showResultModal.value = false

  const payload: CreateUrlRequest = {
    originalUrl: originalUrl.value.trim(),
    alias: urlAlias.value,
    expirationTime: expirationTime.value,
  }
  lastPayload.value = payload

  if (rawUrlError.value || rawAliasError.value || rawExpirationError.value) {
    return
  }

  if (!isAuthed.value) {
    setPendingShorten(payload)
    await redirectToLogin()
    return
  }

  reset()
  showResultModal.value = false

  let outcome: Awaited<ReturnType<typeof submit>> | null = null
  try {
    outcome = await submit(payload)
    if (!outcome.ok && outcome.reason === 'unauthorized') {
      setPendingShorten(payload)
      await redirectToLogin()
      return
    }
  } catch {
    showResultModal.value = true
    return
  }

  showAdvancedOptions.value = false
  urlAlias.value = ''
  expirationTime.value = ''
  if (outcome?.ok) {
    originalUrl.value = ''
    showValidation.value = false
  }

  showResultModal.value = true
}

const handleUpdateAlias = (alias: string) => {
  urlAlias.value = alias
}

const handleUpdateExpirationTime = (expTime: string) => {
  expirationTime.value = expTime
}

const closeResultModal = () => {
  showResultModal.value = false
  reset()
}

const retryLastSubmit = async () => {
  if (!lastPayload.value) return
  originalUrl.value = lastPayload.value.originalUrl
  urlAlias.value = lastPayload.value.alias ?? ''
  expirationTime.value = lastPayload.value.expirationTime ?? ''
  await onSubmit()
}
</script>

<template>
  <div class="flex flex-col md:items-start w-full max-w-full md:max-w-3xl my-2 mx-auto">
    <input
      v-model="originalUrl"
      placeholder="https://example.com"
      :class="[
        'w-full p-3 bg-white rounded shadow-sm',
        urlError
          ? 'border-red-400 focus:border-red-500 focus:outline-red-200'
          : 'border-gray-200 focus:outline-green-300 focus:border-green-400',
        'border',
      ]"
    />

    <AdvancedOptions
      v-model="showAdvancedOptions"
      :shortBaseUrl="shortBaseUrl"
      :alias="urlAlias"
      :expirationTime="expirationTime"
      :alias-error="aliasError"
      :expiration-error="expirationError"
      @update:alias="handleUpdateAlias"
      @update:expirationTime="handleUpdateExpirationTime"
    />

    <button
      type="button"
      @click="onSubmit"
      :disabled="!canSubmit"
      class="mt-3 px-2 py-1 bg-green-400 text-white rounded hover:bg-green-600 disabled:opacity-50 transition ease-in-out duration-200 cursor-pointer disabled:cursor-not-allowed"
    >
      {{ loading ? '...' : 'Shorten' }}
    </button>
    <div class="mt-2 min-h-[20px]">
      <p
        v-if="validationMessages.length"
        class="text-sm text-red-500"
      >
        {{ validationMessages[0] }}
      </p>
      <p v-else class="text-sm text-transparent select-none">placeholder</p>
    </div>
    <p v-if="error" class="mt-3 text-red-500">{{ error }}</p>

    <ShortenResultModal
      v-if="showResultModal"
      :short-url="shortUrl"
      :loading="loading"
      :error="error"
      @close="closeResultModal"
      @retry="retryLastSubmit"
    />
  </div>
</template>
