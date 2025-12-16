<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = defineProps<{
  modelValue: boolean
  shortBaseUrl: string
  alias: string
  expirationTime: string
}>()

const localExpirationTime = ref(props.expirationTime)

watch(
  () => props.expirationTime,
  (newValue) => {
    localExpirationTime.value = newValue
  },
)

const emit = defineEmits<{
  'update:modelValue': [v: boolean]
  'update:alias': [v: string]
  'update:expirationTime': [v: string]
}>()

const aliasError = computed(() => {
  const value = props.alias.trim()
  if (!value) return null
  if (!/^[a-zA-Z0-9_-]{5,32}$/.test(value)) {
    return 'Use 5-32 caracteres (letters, numbers, "-" o "_").'
  }
  return null
})

const aliasPreview = computed(() => {
  const value = props.alias.trim() || 'your-alias'
  return `${props.shortBaseUrl}/${value}`
})

const toggle = () => {
  emit('update:modelValue', !props.modelValue)
  if (props.modelValue) {
    emit('update:alias', '')
    emit('update:expirationTime', '')
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
      <span class="px-2 py-2 text-sm text-gray-400 bg-gray-200 border border-gray-200 rounded">
        {{ shortBaseUrl }}/
      </span>
      <input
        :value="alias"
        @blur="emit('update:alias', ($event.target as HTMLInputElement).value)"
        placeholder="my-custom-alias"
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

    <div class="pt-2">
      <label class="block text-sm font-semibold text-gray-700"> Expiration time (optional) </label>
      <input
        type="datetime-local"
        :value="localExpirationTime"
        @input="localExpirationTime = ($event.target as HTMLInputElement).value"
        @blur="emit('update:expirationTime', localExpirationTime)"
        class="w-full p-2 bg-white border border-gray-200 rounded focus:outline-green-300 focus:border-green-400"
      />
    </div>
  </div>
</template>
