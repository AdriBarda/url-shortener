<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const { user, isAuthed } = storeToRefs(authStore)

const onSignOut = async () => {
  await authStore.signOut()
}
</script>

<template>
  <header class="fixed w-full">
    <nav class="bg-white p-4 shadow flex justify-between items-center">
      <RouterLink to="/">Home</RouterLink>

      <div v-if="isAuthed" class="flex items-center gap-3">
        <img
          v-if="user?.avatarUrl"
          :src="user.avatarUrl"
          alt="Avatar"
          class="size-10 rounded-full border border-green-300"
        />
        <span class="text-sm text-gray-600">
          {{ user?.email }}
        </span>
        <button
          class="text-sm px-3 py-1 rounded border hover:bg-gray-100 cursor-pointer"
          @click="onSignOut"
        >
          Sign out
        </button>
      </div>

      <button v-else class="text-sm px-3 py-1 rounded border hover:bg-gray-100">
        <RouterLink to="/login" class="text-sm"> Sign In </RouterLink>
      </button>
    </nav>
  </header>

  <main class="flex justify-center items-center min-h-full">
    <RouterView />
  </main>
</template>
