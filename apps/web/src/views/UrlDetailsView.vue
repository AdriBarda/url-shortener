<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getUrlStats, ApiError } from '@/services/urlApi'
import type { UrlStats } from '@repo/shared'

const route = useRoute()
const router = useRouter()

const shortCode = computed(() => String(route.params.shortCode ?? ''))
const shortBaseUrl = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000').replace(/\/$/, '')

const stats = ref<UrlStats | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

const goBack = () => {
  router.push({ name: 'dashboard' })
}

const formatDate = (value: string | null | undefined): string => {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString()
}

const fetchStats = async () => {
  loading.value = true
  error.value = null
  try {
    stats.value = await getUrlStats(shortCode.value)
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      error.value = 'URL not found.'
    } else {
      error.value = err instanceof Error ? err.message : 'Failed to load stats.'
    }
  } finally {
    loading.value = false
  }
}

await fetchStats()

const maxCount = computed(() => {
  const counts = stats.value?.clicksLast7Days.map((point) => point.count) ?? [1]
  return Math.max(1, ...counts)
})

const barClass = (count: number, max: number) => {
  const ratio = max > 0 ? count / max : 0
  if (count === 0) return 'h-0 bg-gray-200/60'

  let color = 'bg-green-300/50'
  if (ratio >= 0.85) color = 'bg-green-600/80'
  else if (ratio >= 0.65) color = 'bg-green-500/70'
  else if (ratio >= 0.4) color = 'bg-green-400/60'

  const heights = ['h-1', 'h-2', 'h-3', 'h-4', 'h-5', 'h-6', 'h-8', 'h-10', 'h-12', 'h-16', 'h-20']
  const idx = Math.max(0, Math.min(heights.length - 1, Math.round(ratio * (heights.length - 1))))
  return `${color} ${heights[idx]}`
}
</script>

<template>
  <section class="w-full max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div class="space-y-2">
        <p class="text-xs uppercase tracking-[0.2em] text-green-600">Dashboard</p>
        <h1 class="text-2xl sm:text-3xl font-semibold text-heading">URL Details</h1>
        <p class="text-sm text-gray-600 max-w-2xl">
          Metrics and activity for this short URL.
        </p>
      </div>
      <button
        class="px-4 py-2 text-sm rounded border border-gray-200 hover:bg-gray-50 cursor-pointer"
        @click="goBack"
      >
        Back to Dashboard
      </button>
    </div>

    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold text-gray-800">Overview</h2>
        <p class="text-xs text-gray-500">All metrics at a glance.</p>
      </div>
      <button
        class="px-3 py-1.5 text-xs rounded border border-gray-200 hover:bg-gray-50"
        :disabled="loading"
        @click="fetchStats"
      >
        {{ loading ? 'Refreshing' : 'Refresh' }}
      </button>
    </div>

    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div class="rounded-xl border border-gray-200 bg-white/70 p-4 shadow-sm">
        <div class="text-xs uppercase tracking-[0.2em] text-gray-500">Short URL</div>
        <a
          class="mt-2 inline-flex text-green-700! hover:underline!"
          :href="`${shortBaseUrl}/${shortCode}`"
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ `${shortBaseUrl}/${shortCode}` }}
        </a>
      </div>
      <div class="rounded-xl border border-gray-200 bg-white/70 p-4 shadow-sm">
        <div class="text-xs uppercase tracking-[0.2em] text-gray-500">Total clicks</div>
        <div class="mt-2 text-2xl font-semibold">
          {{ stats ? stats.totalClicks : '—' }}
        </div>
      </div>
      <div class="rounded-xl border border-gray-200 bg-white/70 p-4 shadow-sm">
        <div class="text-xs uppercase tracking-[0.2em] text-gray-500">Last clicked</div>
        <div class="mt-2 text-sm font-semibold">
          {{ stats ? formatDate(stats.lastClickedAt) : '—' }}
        </div>
      </div>
      <div class="rounded-xl border border-gray-200 bg-white/70 p-4 shadow-sm">
        <div class="text-xs uppercase tracking-[0.2em] text-gray-500">Last 7 days</div>
        <div class="mt-2 text-2xl font-semibold">
          {{
            stats
              ? stats.clicksLast7Days.reduce((sum, point) => sum + point.count, 0)
              : '—'
          }}
        </div>
      </div>
    </div>

    <div class="rounded-xl border border-gray-200 bg-white/70 p-6 shadow-sm space-y-3">
      <div class="flex items-center justify-between">
        <div class="text-sm font-semibold text-gray-700">Daily clicks</div>
        <div class="text-xs text-gray-500">Last 7 days</div>
      </div>

      <div v-if="loading" class="text-sm text-gray-500">Loading stats…</div>
      <div v-else-if="error" class="text-sm text-red-600">{{ error }}</div>
      <div v-else-if="!stats" class="text-sm text-gray-500">No stats available.</div>
      <div v-else class="grid grid-cols-7 gap-2 items-end h-28">
        <div
          v-for="point in stats.clicksLast7Days"
          :key="point.date"
          class="flex flex-col items-center gap-1 text-[10px] text-gray-500"
        >
          <span class="text-[10px] font-semibold text-gray-700">
            {{ point.count }}
          </span>
          <div
            class="w-full rounded transition-all duration-300 ease-out"
            :class="barClass(point.count, maxCount)"
            :title="`${point.date}: ${point.count}`"
          />
          <span>{{ point.date.slice(5) }}</span>
        </div>
      </div>
    </div>
  </section>
</template>
