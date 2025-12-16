<script setup lang="ts">
import { computed, ref } from 'vue'
import { createShortUrl } from '@/services/urlApi'
import type { CreateUrlRequest } from '@repo/shared'

const originalUrl = ref('')
const result = ref<string | null>(null)
const error = ref<string | null>(null)
const loading = ref(false)
const showAdvancedOptions = ref<boolean>(false)
const urlAlias = ref('')
const shortBaseUrl = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000').replace(/\/$/, '')
const expirationTime = ref<string | undefined>()

const onSubmit = async () => {
  loading.value = true
  error.value = null
  result.value = null
  try {
    const payload: CreateUrlRequest = {
      originalUrl: originalUrl.value.trim(),
      alias: urlAlias.value.trim() || undefined,
      expirationTime: expirationTime.value,
    }
    const res = await createShortUrl(payload)
    result.value = res.shortUrl
  } catch (e) {
    if (e instanceof Error) {
      error.value = e.message ?? 'Error'
    } else {
      error.value = 'Unknown error'
    }
  } finally {
    loading.value = false
    showAdvancedOptions.value = false
    urlAlias.value = ''
  }
}

const toggleAdvancedOptions = () => {
  showAdvancedOptions.value = !showAdvancedOptions.value
  urlAlias.value = ''
}

const aliasError = computed(() => {
  const value = urlAlias.value.trim()
  if (!value) return null
  if (!/^[a-zA-Z0-9_-]{5,32}$/.test(value)) {
    return 'Usa 5-32 caracteres (letras, números, "-" o "_").'
  }
  return null
})

const aliasPreview = computed(() => {
  const value = urlAlias.value.trim() || 'tu-alias'
  return `${shortBaseUrl}/${value}`
})

const canSubmit = computed(
  () => Boolean(originalUrl.value.trim()) && !loading.value && !aliasError.value,
)
</script>

<template>
  <div class="flex flex-col items-start min-w-xl max-w-5xl my-10 mx-auto">
    <h1 class="text-xl font-semibold mb-2">URL Shortener (mock)</h1>

    <input
      v-model="originalUrl"
      placeholder="https://example.com"
      class="w-full p-3 bg-white border border-gray-200 rounded focus:outline-green-300 focus:border-green-400 shadow-sm"
    />
    <button
      type="button"
      class="mt-2 text-green-400 hover:text-green-300 font-light cursor-pointer underline"
      @click="toggleAdvancedOptions"
    >
      {{ showAdvancedOptions ? 'Hide Advanced Options' : 'Advanced Options' }}
    </button>
    <div
      v-if="showAdvancedOptions"
      class="w-full mt-2 p-3 bg-white border border-gray-100 rounded-lg shadow-sm space-y-2"
    >
      <div class="flex items-center justify-between text-sm font-semibold text-gray-700">
        <span>Alias (optional)</span>
        <span class="text-xs text-gray-500">{{ urlAlias.length }}/32</span>
      </div>

      <div class="flex gap-2">
        <span class="px-2 py-2 text-sm text-gray-400 bg-gray-200 border border-gray-200 rounded">
          {{ shortBaseUrl }}/
        </span>
        <input
          v-model="urlAlias"
          placeholder="mi-alias-personal"
          class="flex-1 p-2 bg-white border border-gray-200 rounded focus:outline-green-300 focus:border-green-400"
          minlength="5"
          maxlength="32"
        />
      </div>

      <p class="text-xs text-gray-500">5–32 characters. Letters, numbers, - and _ only.</p>
      <p v-if="aliasError" class="text-xs text-red-500">{{ aliasError }}</p>
      <p v-else class="text-xs text-green-600">
        Preview:
        <span class="font-mono">{{ aliasPreview }}</span>
      </p>
    </div>
    <button
      type="button"
      @click="onSubmit"
      :disabled="!canSubmit"
      class="mt-3 px-2 py-1 bg-green-400 text-white rounded hover:bg-green-600 disabled:opacity-50 transition ease-in-out duration-200 cursor-pointer disabled:cursor-not-allowed"
    >
      {{ loading ? '...' : 'Shorten' }}
    </button>

    <p v-if="result" class="mt-3 text-green-500">
      Short URL: <a :href="result" target="_blank">{{ result }}</a>
    </p>

    <p v-if="error" class="mt-3 text-red-500">
      {{ error }}
    </p>
  </div>
</template>
