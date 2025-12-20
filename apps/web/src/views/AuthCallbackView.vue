<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/lib/supabase'

const route = useRoute()
const router = useRouter()

function safeNext() {
  const next = route.query.next as string | undefined
  return next && next.startsWith('/') ? next : '/'
}

onMounted(async () => {
  const code = route.query.code
  if (typeof code === 'string') {
    await supabase.auth.exchangeCodeForSession(code)
  }

  await supabase.auth.getSession()

  router.replace(safeNext())
})
</script>

<template>
  <div class="p-6">Signing you in…</div>
</template>
