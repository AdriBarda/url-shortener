<script setup lang="ts">
import { computed } from 'vue'
import { useClipboard } from '@/composables/useClipboard'
import CopyIcon from '@/components/icons/CopyIcon.vue'
import CheckIcon from '@/components/icons/CheckIcon.vue'

const props = defineProps<{
  shortUrl: string | null
  loading: boolean
  error: string | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'retry'): void
}>()

const { copying, lastCopied, copy } = useClipboard()

const showCopiedIcon = computed(() => lastCopied.value === props.shortUrl)

const handleCopy = async () => {
  if (!props.shortUrl) return
  await copy(props.shortUrl)
}
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
    @click.self="emit('close')"
  >
    <div class="w-full max-w-lg rounded-2xl bg-white shadow-2xl p-6 space-y-5 border border-gray-100">
      <div class="space-y-1">
        <p class="text-xs uppercase tracking-wide text-gray-400">Short link status</p>
        <h2 class="text-xl font-semibold">Your link is ready</h2>
      </div>

      <div v-if="loading" class="flex items-center gap-3 text-sm text-gray-600">
        <span class="inline-flex size-8 items-center justify-center rounded-full border-2 border-green-200 border-l-transparent animate-spin"></span>
        Finishing your shortened link...
      </div>

      <div v-else-if="error" class="flex items-start gap-3 rounded-lg bg-red-50 border border-red-100 p-3">
        <div class="mt-0.5 inline-flex size-7 items-center justify-center rounded-full bg-red-100 text-red-600 font-bold">!</div>
        <div class="text-sm text-red-700">
          <p class="font-semibold mb-1">Something went wrong</p>
          <p>{{ error }}</p>
        </div>
      </div>

      <div v-else-if="shortUrl" class="space-y-3">
        <div class="rounded-lg border border-green-100 bg-green-50 p-3">
          <p class="text-xs uppercase tracking-wide text-green-700 font-semibold mb-1">Short URL</p>
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <a
              :href="shortUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="text-lg font-semibold text-green-700 break-all hover:underline"
            >
              {{ shortUrl }}
            </a>
            <button
              type="button"
              class="inline-flex items-center justify-center gap-2 px-3 py-2 text-xs rounded-lg border border-green-200 bg-white hover:bg-green-50 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed transition"
              :disabled="copying || !shortUrl"
              :aria-label="showCopiedIcon ? 'Copied' : copying ? 'Copying' : 'Copy short URL'"
              @click="handleCopy"
            >
              <transition name="fade" mode="out-in">
                <CheckIcon
                  v-if="showCopiedIcon"
                  key="check"
                  class="w-4 h-4 text-green-600"
                />
                <CopyIcon
                  v-else
                  key="copy"
                  class="w-4 h-4 text-gray-700"
                />
              </transition>
              <span class="font-semibold" v-text="showCopiedIcon ? 'Copied' : 'Copy'" />
            </button>
          </div>
        </div>

        <p class="text-xs text-gray-500">You can share this link right away. It opens in a new tab.</p>
      </div>

      <div class="flex justify-end gap-2 pt-3 border-t border-gray-100">
        <button
          v-if="error"
          type="button"
          class="px-3 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
          @click="emit('retry')"
        >
          Retry
        </button>
        <button
          type="button"
          class="px-4 py-2 text-sm rounded-lg bg-green-500 text-white hover:bg-green-600 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
          :disabled="loading"
          @click="emit('close')"
        >
          Close
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 150ms ease, transform 150ms ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
