<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import type { CreateUrlRequest } from '@repo/shared'
import AdvancedOptions from '@/components/AdvancedOptions.vue'
import { useShortenUrl } from '@/composables/useShortenUrl'
import { useRoute, useRouter } from 'vue-router'
import { clearPendingShorten, getPendingShorten, setPendingShorten } from '@/utils/pendingShorten'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { isAuthed, ready } = storeToRefs(authStore)
const originalUrl = ref('')
const showAdvancedOptions = ref(false)
const urlAlias = ref('')
const expirationTime = ref('')

const shortBaseUrl = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000').replace(/\/$/, '')

const { loading, error, result, submit, reset } = useShortenUrl()

const aliasError = computed(() => {
  const value = urlAlias.value.trim()
  if (!value) return null
  if (!/^[a-zA-Z0-9_-]{5,32}$/.test(value)) return 'invalid'
  return null
})

const canSubmit = computed(
  () => Boolean(originalUrl.value.trim()) && !loading.value && !aliasError.value,
)

const onSubmit = async () => {
  const payload: CreateUrlRequest = {
    originalUrl: originalUrl.value.trim(),
    alias: urlAlias.value,
    expirationTime: expirationTime.value,
  }

  if (!isAuthed.value) {
    setPendingShorten(payload)
    await router.push({
      name: 'login',
      query: { next: route.fullPath || '/' },
    })
    return
  }

  reset()

  try {
    const outcome = await submit(payload)
    if (!outcome.ok && outcome.reason === 'unauthorized') {
      setPendingShorten(payload)
      await router.push({
        name: 'login',
        query: { next: route.fullPath || '/' },
      })
      return
    }
  } catch {
    return
  }

  showAdvancedOptions.value = false
  urlAlias.value = ''
  expirationTime.value = ''
}

const handleUpdateAlias = (alias: string) => {
  urlAlias.value = alias
}

const handleUpdateExpirationTime = (expTime: string) => {
  expirationTime.value = expTime
}

watch(
  [ready, isAuthed],
  async ([r, authed]) => {
    if (!r || !authed) return

    const pending = getPendingShorten()
    if (!pending) return

    clearPendingShorten()

    reset()
    try {
      const outcome = await submit(pending)
      if (!outcome.ok && outcome.reason === 'unauthorized') {
        setPendingShorten(pending)
        await router.push({
          name: 'login',
          query: { next: route.fullPath || '/' },
        })
        return
      }
    } catch {
      return
    }

    showAdvancedOptions.value = false
    urlAlias.value = ''
    expirationTime.value = ''
  },
  { immediate: true },
)
</script>

<template>
  <div class="flex flex-col md:items-start w-full max-w-full md:max-w-3xl my-2 mx-auto">
    <input
      v-model="originalUrl"
      placeholder="https://example.com"
      class="w-full p-3 bg-white border border-gray-200 rounded focus:outline-green-300 focus:border-green-400 shadow-sm"
    />

    <AdvancedOptions
      v-model="showAdvancedOptions"
      :shortBaseUrl="shortBaseUrl"
      :alias="urlAlias"
      :expirationTime="expirationTime"
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

    <p v-if="result?.shortUrl" class="mt-3 text-green-500">
      Short URL: <a :href="result.shortUrl" target="_blank">{{ result.shortUrl }}</a>
    </p>

    <p v-if="error" class="mt-3 text-red-500">{{ error }}</p>
  </div>
</template>
