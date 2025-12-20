<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { toUiError } from '@/utils/errors'

const route = useRoute()
const router = useRouter()
const { signInWithOAuth, signIn, signUp } = useAuth()

const next = (route.query.next as string) || '/'

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref<string | null>(null)
const infoMsg = ref<string | null>(null)

const validateCredentials = (): string | null => {
  const e = email.value.trim()
  if (!e) return 'Email is required.'
  if (!password.value) return 'Password is required.'
  if (password.value.length < 6) return 'Password must be at least 6 characters.'
  return null
}

const onGitHub = async () => {
  errorMsg.value = null
  infoMsg.value = null
  loading.value = true
  try {
    await signInWithOAuth('github', next)
  } catch (err: unknown) {
    errorMsg.value = toUiError(err).message
  } finally {
    loading.value = false
  }
}

const onSignIn = async () => {
  errorMsg.value = null
  infoMsg.value = null

  const validation = validateCredentials()
  if (validation) {
    errorMsg.value = validation
    return
  }

  loading.value = true
  try {
    await signIn(email.value.trim(), password.value)
    router.replace(next)
  } catch (err: unknown) {
    errorMsg.value = toUiError(err).message
  } finally {
    loading.value = false
  }
}

const onSignUp = async () => {
  errorMsg.value = null
  infoMsg.value = null

  const validation = validateCredentials()
  if (validation) {
    errorMsg.value = validation
    return
  }

  loading.value = true
  try {
    const data = await signUp(email.value.trim(), password.value, next)

    email.value = ''
    password.value = ''

    if (!data.session) {
      infoMsg.value = 'We have sent an email to verify your account. Please verify your email.'
      return
    }

    router.replace(next)
  } catch (err: unknown) {
    errorMsg.value = toUiError(err).message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="max-w-md mx-auto p-6 space-y-4">
    <h1 class="text-2xl font-semibold">Sign in</h1>

    <button class="w-full border rounded px-4 py-2" :disabled="loading" @click="onGitHub">
      Continue with GitHub
    </button>

    <div class="flex items-center gap-3">
      <div class="h-px bg-gray-200 flex-1"></div>
      <div class="text-xs text-gray-500">or</div>
      <div class="h-px bg-gray-200 flex-1"></div>
    </div>

    <div class="space-y-2">
      <input class="w-full border rounded px-3 py-2" placeholder="Email" v-model="email" />
      <input
        class="w-full border rounded px-3 py-2"
        placeholder="Password"
        type="password"
        v-model="password"
      />
      <div class="flex gap-2">
        <button
          class="flex-1 bg-black text-white rounded px-4 py-2"
          :disabled="loading"
          @click="onSignIn"
        >
          Sign in
        </button>
        <button class="flex-1 border rounded px-4 py-2" :disabled="loading" @click="onSignUp">
          Sign up
        </button>
      </div>
    </div>

    <p v-if="errorMsg" class="text-sm text-red-600">{{ errorMsg }}</p>
    <p v-if="infoMsg" class="text-sm text-green-600">{{ infoMsg }}</p>
  </div>
</template>
