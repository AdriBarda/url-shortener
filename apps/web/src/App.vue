<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <header class="fixed w-full">
    <div>
      <nav class="bg-white p-4 shadow flex justify-between items-center">
        <RouterLink to="/">Home</RouterLink>
      </nav>
    </div>
  </header>

  <main class="flex justify-center items-center min-h-full">
    <RouterView />
  </main>
</template>
