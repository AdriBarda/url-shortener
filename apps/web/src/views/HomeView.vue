<script setup lang="ts">
import { ref } from 'vue'
import { createShortUrl } from '@/services/urlApi'

const originalUrl = ref('')
const result = ref<string | null>(null)
const error = ref<string | null>(null)
const loading = ref(false)

async function onSubmit() {
  loading.value = true
  error.value = null
  result.value = null
  try {
    const res = await createShortUrl({ originalUrl: originalUrl.value })
    result.value = res.shortUrl
  } catch (e) {
    if (e instanceof Error) {
      error.value = e.message ?? 'Error'
    } else {
      error.value = 'Unknown error'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="max-w-5xl my-10 mx-auto">
    <h1 class="text-xl font-semibold">URL Shortener (mock)</h1>

    <input
      v-model="originalUrl"
      placeholder="https://example.com"
      class="w-full p-2 bg-white border border-gray-200 rounded focus:outline-green-300 focus:border-green-400"
    />
    <button
      @click="onSubmit"
      :disabled="loading"
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
