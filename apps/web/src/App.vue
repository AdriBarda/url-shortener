<script setup lang="ts">
import { RouterView, useRouter, useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import AppNavbar from '@/components/AppNavbar.vue'

const authStore = useAuthStore()
const { user, isAuthed } = storeToRefs(authStore)
const router = useRouter()
const route = useRoute()

const onSignOut = async () => {
  await authStore.signOut()
  await router.push('/')
}

const mainClasses = computed(() => [
  'min-h-screen pt-20 pb-12',
  route.name === 'about' ? '' : 'flex justify-center items-center',
])
</script>

<template>
  <div class="app-prose min-h-screen">
    <AppNavbar :user="user" :is-authed="isAuthed" @sign-out="onSignOut" />

    <main :class="mainClasses">
      <Suspense>
        <RouterView />
        <template #fallback>
          <div class="text-sm text-gray-600">Loading…</div>
        </template>
      </Suspense>
    </main>
  </div>
</template>
