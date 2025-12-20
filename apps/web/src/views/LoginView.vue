<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const route = useRoute()
const { signInWithOAuth } = useAuth()

const next = (route.query.next as string) || '/dashboard'

const loading = ref(false)
const errorMsg = ref<string | null>(null)

const onGitHub = () => {
  errorMsg.value = null
  loading.value = true
  try {
    signInWithOAuth('github', next)
  } catch (err: unknown) {
    errorMsg.value = err instanceof Error ? err.message : 'GitHub login failed'
    loading.value = false
  }
}
</script>

<template>
  <div class="max-w-md mx-auto p-6 space-y-4">
    <h1 class="text-2xl font-semibold">Sign in</h1>

    <button
      class="w-full border rounded px-4 py-2 cursor-pointer"
      :disabled="loading"
      @click="onGitHub"
    >
      {{ loading ? 'Redirecting…' : 'Continue with GitHub' }}
    </button>

    <p v-if="errorMsg" class="text-sm text-red-600">{{ errorMsg }}</p>
    <p class="text-sm text-gray-500">Email/password sign-in is coming soon.</p>
  </div>
</template>
