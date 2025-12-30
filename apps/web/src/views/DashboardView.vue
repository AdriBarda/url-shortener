<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { CreateUrlRequest, UrlListItem } from '@repo/shared'
import { getMyUrls, ApiError } from '@/services/urlApi'
import { useAuthStore } from '@/stores/auth'
import { useShortenUrl } from '@/composables/useShortenUrl'
import { clearPendingShorten, getPendingShorten } from '@/utils/pendingShorten'
import ShortenResultModal from '@/components/ShortenResultModal.vue'
import { useClipboard } from '@/composables/useClipboard'
import CopyIcon from '@/components/icons/CopyIcon.vue'
import CheckIcon from '@/components/icons/CheckIcon.vue'
import CrossIcon from '@/components/icons/CrossIcon.vue'

const shortBaseUrl = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000').replace(/\/$/, '')

const router = useRouter()
const authStore = useAuthStore()
const { copy, copying, lastCopied, error: copyError } = useClipboard()

const urls = ref<UrlListItem[]>([])
const loading = ref(false)
const initialLoad = ref(true)
const error = ref<string | null>(null)
const {
  loading: pendingShortenLoading,
  error: pendingShortenError,
  result: pendingShortenResult,
  submit: submitPendingShorten,
  reset: resetPendingShorten,
} = useShortenUrl()
const showPendingShortenModal = ref(false)
const pendingShortenPayload = ref<CreateUrlRequest | null>(null)
const pendingShortUrl = computed(() => pendingShortenResult.value?.shortUrl ?? null)
const lastCopiedShortCode = computed(() => {
  if (!lastCopied.value) return null
  const baseWithSlash = `${shortBaseUrl}/`
  if (lastCopied.value.startsWith(baseWithSlash)) {
    return lastCopied.value.slice(baseWithSlash.length)
  }
  return null
})

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

const closePendingShortenModal = () => {
  showPendingShortenModal.value = false
  resetPendingShorten()
}

const runPendingShorten = async (payload: CreateUrlRequest) => {
  showPendingShortenModal.value = true
  pendingShortenPayload.value = payload
  resetPendingShorten()

  try {
    const outcome = await submitPendingShorten(payload)
    if (outcome.ok) {
      clearPendingShorten()
      pendingShortenPayload.value = null
      await fetchUrls()
    } else if (outcome.reason === 'unauthorized') {
      await authStore.signOut()
      await router.replace({ name: 'login', query: { next: '/dashboard' } })
    }
  } catch (err) {
    pendingShortenError.value = err instanceof Error ? err.message : 'Failed to retry shorten.'
  }
}

const retryPendingShorten = async () => {
  if (!pendingShortenPayload.value) return
  await runPendingShorten(pendingShortenPayload.value)
}

const processPendingShorten = async () => {
  const pending = getPendingShorten()
  if (!pending) return
  clearPendingShorten()
  await runPendingShorten(pending)
}

const copyShortUrl = async (code: string) => {
  const url = `${shortBaseUrl}/${code}`
  await copy(url)
}

const isCopied = (code: string) => lastCopiedShortCode.value === code

await fetchUrls()
await processPendingShorten()
</script>

<template>
  <div class="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-4">
    <ShortenResultModal
      v-if="showPendingShortenModal"
      :short-url="pendingShortUrl"
      :loading="pendingShortenLoading"
      :error="pendingShortenError"
      @close="closePendingShortenModal"
      @retry="retryPendingShorten"
    />

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
            <th class="px-4 py-2 font-semibold text-center">Copy</th>
            <th class="px-4 py-2 font-semibold text-center">Details</th>
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
              <div
                :class="[
                  'inline-flex items-center justify-center w-6 h-6 mx-auto font-semibold',
                  isExpired(url.expirationTime) ? 'text-green-600' : 'text-red-600',
                ]"
              >
                <CheckIcon v-if="isExpired(url.expirationTime)" class="w-4 h-4" />
                <CrossIcon v-else class="w-4 h-4" />
              </div>
            </td>
            <td class="px-4 py-2 text-center">
              <button
                type="button"
                class="inline-flex items-center justify-center gap-1 px-3 py-2 text-xs rounded border border-gray-200 hover:bg-gray-50 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed transition"
                :disabled="copying"
                :aria-label="
                  isCopied(url.shortCode) ? 'Copied' : copying ? 'Copying' : 'Copy short URL'
                "
                @click="copyShortUrl(url.shortCode)"
              >
                <transition name="fade" mode="out-in">
                  <CheckIcon
                    v-if="isCopied(url.shortCode)"
                    key="check"
                    class="w-4 h-4 text-green-600"
                  />
                  <CopyIcon v-else key="copy" class="w-4 h-4 text-gray-700" />
                </transition>
              </button>
              <p v-if="copyError" class="text-xs text-red-500 mt-1">{{ copyError }}</p>
            </td>
            <td class="px-4 py-2 text-center">
              <router-link
                class="inline-flex items-center justify-center px-3 py-2 text-xs rounded border border-gray-200 hover:bg-gray-50"
                :to="{ name: 'url-details', params: { shortCode: url.shortCode } }"
              >
                View
              </router-link>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 150ms ease,
    transform 150ms ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
