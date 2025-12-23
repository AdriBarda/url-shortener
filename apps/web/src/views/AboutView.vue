<template>
  <section class="max-w-5xl mx-auto px-6 py-16 space-y-10">
    <header class="space-y-3">
      <p class="text-sm uppercase tracking-[0.2em] text-green-600">About this project</p>
      <h1 class="text-3xl sm:text-4xl font-semibold text-heading">
        <span class="text-green-600">URL Shortener</span> by Adri
      </h1>
      <p class="inline-flex items-center gap-2 text-base font-semibold text-gray-700">
        <span class="-z-1 text-3xl animate-rotational-wave">👋</span> Hello there, Adri here.
      </p>
      <p class="text-gray-600 max-w-3xl">
        A pragmatic, full-stack URL shortener built to be simple to use and easy to scale.
        Everything auth- and data-related goes through the Node backend; the Vue app stays lean.
      </p>
    </header>

    <div class="flex flex-wrap gap-2">
      <span
        class="px-3 py-1 rounded-full text-xs font-semibold border border-green-200 bg-green-50 text-green-800"
      >
        Node.js (Express)
      </span>
      <span
        class="px-3 py-1 rounded-full text-xs font-semibold border border-green-200 bg-green-50 text-green-800"
      >
        Vue 3 + Vite + Tailwind
      </span>
      <span
        class="px-3 py-1 rounded-full text-xs font-semibold border border-green-200 bg-green-50 text-green-800"
      >
        Supabase
      </span>
      <span
        class="px-3 py-1 rounded-full text-xs font-semibold border border-green-200 bg-green-50 text-green-800"
      >
        Redis
      </span>
    </div>

    <div class="grid gap-6 md:grid-cols-2">
      <div class="rounded-xl border border-gray-200 bg-white/70 p-6 shadow-sm">
        <h2 class="text-xl font-semibold mb-3 text-green-700">What it does</h2>
        <ul class="space-y-2 text-gray-700">
          <li class="flex items-start gap-2">
            <span class="mt-2.5 h-1.5 w-1.5 rounded-full bg-green-500 shrink-0"></span>
            <span>Shorten links and serve redirects quickly from Redis + Postgres.</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="mt-2.5 h-1.5 w-1.5 rounded-full bg-green-500 shrink-0"></span>
            <span>GitHub OAuth via Supabase, proxied through the Node API for control.</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="mt-2.5 h-1.5 w-1.5 rounded-full bg-green-500 shrink-0"></span>
            <span>Session cookies + server-side refresh to keep the SPA lightweight.</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="mt-2.5 h-1.5 w-1.5 rounded-full bg-green-500 shrink-0"></span>
            <span>Dashboard to view your URLs, with authenticated API access only.</span>
          </li>
        </ul>
      </div>

      <div class="rounded-xl border border-gray-200 bg-white/70 p-6 shadow-sm">
        <h2 class="text-xl font-semibold mb-3 text-green-700">Why this stack</h2>
        <ul class="space-y-2 text-gray-700">
          <li class="flex items-start gap-2">
            <span class="mt-2.5 h-1.5 w-1.5 rounded-full bg-green-500 shrink-0"></span>
            <span>Vue + Vite for fast DX and small, focused UI.</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="mt-2.5 h-1.5 w-1.5 rounded-full bg-green-500 shrink-0"></span>
            <span>Supabase to avoid running local auth; backend keeps tokens server-side.</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="mt-2.5 h-1.5 w-1.5 rounded-full bg-green-500 shrink-0"></span>
            <span>Redis as a read-through cache to handle high lookup volume.</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="mt-2.5 h-1.5 w-1.5 rounded-full bg-green-500 shrink-0"></span>
            <span>Separation of concerns: API owns data/auth, frontend consumes it.</span>
          </li>
        </ul>
      </div>
    </div>

    <div class="rounded-xl border border-gray-200 bg-white/70 p-6 shadow-sm">
      <h2 class="text-xl font-semibold mb-3 text-green-700">Roadmap</h2>
      <ul class="space-y-2 text-gray-700">
        <li class="flex items-start gap-2">
          <span class="mt-2.5 h-1.5 w-1.5 rounded-full bg-green-500 shrink-0"></span>
          <span>Add link analytics (click counts, referrers).</span>
        </li>
        <li class="flex items-start gap-2">
          <span class="mt-2.5 h-1.5 w-1.5 rounded-full bg-green-500 shrink-0"></span>
          <span>Expiration controls and alerts.</span>
        </li>
        <li class="flex items-start gap-2">
          <span class="mt-2.5 h-1.5 w-1.5 rounded-full bg-green-500 shrink-0"></span>
          <span>More auth providers beyond GitHub.</span>
        </li>
      </ul>
    </div>
  </section>
</template>
