<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import type { UrlListItem } from '@repo/shared'
import { getMyUrls, ApiError } from '@/services/urlApi'
import { useAuthStore } from '@/stores/auth'

const shortBaseUrl = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000').replace(/\/$/, '')

const router = useRouter()
const authStore = useAuthStore()

const urls = ref<UrlListItem[]>([])
const loading = ref(false)
const initialLoad = ref(true)
const error = ref<string | null>(null)

const formatDate = (value: string | null | undefined): string => {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString()
}

const isExpired = (value: string | null | undefined): boolean => {
  if (!value) return false
  const time = new Date(value).getTime()
  if (Number.isNaN(time)) return false
  return time < Date.now()
}

const fetchUrls = async () => {
  loading.value = true
  error.value = null

  try {
    urls.value = await getMyUrls()
  } catch (err: unknown) {
    if (err instanceof ApiError && err.status === 401) {
      await authStore.signOut()
      await router.replace({ name: 'login', query: { next: '/dashboard' } })
      return
    }
    error.value = err instanceof Error ? err.message : 'Failed to load URLs.'
  } finally {
    loading.value = false
    initialLoad.value = false
  }
}

await fetchUrls()
</script>

<template>
  <div class="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-4">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 class="text-2xl font-semibold">Hello {{ authStore.user?.email }}</h1>
        <p class="text-sm text-gray-500">Your latest Shortened URLs</p>
      </div>
      <button
        class="px-4 py-2 text-sm rounded border border-gray-200 hover:bg-gray-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="loading"
        @click="fetchUrls"
      >
        {{ loading ? 'Refreshing' : 'Refresh' }}
      </button>
    </div>

    <div v-if="initialLoad && loading" class="text-gray-600 text-sm">Loading URLs…</div>
    <div v-else-if="error" class="text-sm text-red-600">{{ error }}</div>
    <div v-else-if="urls.length === 0" class="text-sm text-gray-600">No URLs created yet.</div>
    <div v-else class="overflow-x-auto bg-white border border-gray-100 rounded shadow-sm">
      <table class="min-w-full text-sm">
        <thead class="bg-gray-50 text-left">
          <tr class="text-gray-600">
            <th class="px-4 py-2 font-semibold">Short Url</th>
            <th class="px-4 py-2 font-semibold">Original Url</th>
            <th class="px-4 py-2 font-semibold">Created At</th>
            <th class="px-4 py-2 font-semibold">Expires At</th>
            <th class="px-4 py-2 font-semibold text-center">Expired</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="url in urls" :key="url.shortCode" class="border-t border-gray-100">
            <td class="px-4 py-2">
              <a
                class="text-green-600! hover:underline!"
                :href="`${shortBaseUrl}/${url.shortCode}`"
                target="_blank"
                rel="noopener noreferrer"
              >
                {{ `${shortBaseUrl}/${url.shortCode}` }}
              </a>
            </td>
            <td
              class="px-4 py-2 max-w-xs sm:max-w-sm lg:max-w-md truncate"
              :title="url.originalUrl"
            >
              {{ url.originalUrl }}
            </td>
            <td class="px-4 py-2 text-gray-700">{{ formatDate(url.createdAt) }}</td>
            <td class="px-4 py-2 text-gray-700">{{ formatDate(url.expirationTime) }}</td>
            <td class="px-4 py-2 text-gray-700 text-center">
              <span
                :class="[
                  'font-semibold',
                  isExpired(url.expirationTime) ? 'text-green-600' : 'text-red-600',
                ]"
              >
                {{ isExpired(url.expirationTime) ? '✔︎' : '✕' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
