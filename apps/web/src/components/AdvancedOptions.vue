<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = defineProps<{
  shortBaseUrl: string
  aliasError?: string | null
  expirationError?: string | null
}>()

const modelValue = defineModel<boolean>({ default: false })
const alias = defineModel<string>('alias', { default: '' })
const expirationTime = defineModel<string>('expirationTime', { default: '' })

const localExpirationTime = ref(expirationTime.value)

watch(
  () => expirationTime.value,
  (newValue) => {
    localExpirationTime.value = newValue
  },
)

const aliasError = computed(() => props.aliasError ?? null)

const aliasPreview = computed(() => {
  const value = alias.value.trim() || 'your-alias'
  return `${props.shortBaseUrl}/${value}`
})

const handleExpirationInput = (event: Event) => {
  const value = (event.target as HTMLInputElement).value
  localExpirationTime.value = value
  expirationTime.value = value
}

const toggle = () => {
  modelValue.value = !modelValue.value
  if (!modelValue.value) {
    alias.value = ''
    expirationTime.value = ''
  }
}
</script>

<template>
  <button
    type="button"
    class="mt-2 text-green-400 hover:text-green-300 font-light cursor-pointer underline"
    @click="toggle"
  >
    {{ modelValue ? 'Hide Advanced Options' : 'Advanced Options' }}
  </button>

  <div
    v-if="modelValue"
    class="w-full mt-2 p-3 bg-white border border-gray-100 rounded-lg shadow-sm space-y-2"
  >
    <div class="flex items-center justify-between text-sm font-semibold text-gray-700">
      <span>Alias (optional)</span>
      <span class="text-xs text-gray-500">{{ alias.length }}/32</span>
    </div>

    <div class="flex gap-2">
      <div
        class="inline-flex items-center justify-center px-2 py-2 text-sm text-gray-400 bg-gray-200 border border-gray-200 rounded"
      >
        {{ shortBaseUrl }}/
      </div>
      <input
        :value="alias"
        @input="alias = ($event.target as HTMLInputElement).value"
        placeholder="my-custom-alias"
        :class="[
          'flex-1 p-2 bg-white border rounded focus:outline-green-300 focus:border-green-400',
          aliasError ? 'border-red-400 focus:border-red-500 focus:outline-red-200' : 'border-gray-200',
        ]"
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

    <div class="pt-2">
      <label class="block text-sm font-semibold text-gray-700"> Expiration time (optional) </label>
      <input
        type="datetime-local"
        :value="localExpirationTime"
        @input="handleExpirationInput"
        :class="[
          'w-full p-2 bg-white border rounded focus:outline-green-300 focus:border-green-400',
          expirationError ? 'border-red-400 focus:border-red-500 focus:outline-red-200' : 'border-gray-200',
        ]"
      />
      <p v-if="expirationError" class="text-xs text-red-500 mt-1">{{ expirationError }}</p>
    </div>
  </div>
</template>
