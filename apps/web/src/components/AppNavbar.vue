<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { ref, onMounted, onBeforeUnmount } from 'vue'

type User = {
  email?: string | null
  avatarUrl?: string | null
} | null

defineProps<{
  user: User
  isAuthed: boolean
}>()

const emit = defineEmits<{
  (e: 'sign-out'): void
}>()

const isUserMenuVisible = ref(false)
const isMenuVisible = ref(false)
const rootEl = ref<HTMLElement | null>(null)

const closeMenus = () => {
  isUserMenuVisible.value = false
  isMenuVisible.value = false
}

const toggleUserMenu = () => {
  isUserMenuVisible.value = !isUserMenuVisible.value
}

const toggleMenu = () => {
  isMenuVisible.value = !isMenuVisible.value
  isUserMenuVisible.value = false
}

const onSignOut = () => {
  closeMenus()
  emit('sign-out')
}

const handleOutsideClick = (event: MouseEvent) => {
  const el = rootEl.value
  if (!el) return
  if (el.contains(event.target as Node)) return
  closeMenus()
}

const handleResize = () => {
  if (window.innerWidth >= 768) {
    isMenuVisible.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleOutsideClick)
  window.addEventListener('resize', handleResize)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', handleOutsideClick)
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <header class="fixed w-full not-prose" ref="rootEl">
    <nav
      class="bg-neutral-primary fixed w-full z-20 top-0 start-0 border-b border bg-gray-50 border-gray-300 shadow"
    >
      <div class="relative max-w-7xl flex flex-wrap items-center justify-between mx-auto p-4">
        <RouterLink
          to="/"
          class="flex items-center space-x-3 rtl:space-x-reverse"
          @click="closeMenus"
        >
          <span class="self-center text-xl text-heading font-semibold whitespace-nowrap">
            URL Shortener
          </span>
        </RouterLink>
        <div
          class="relative flex items-center md:order-2 space-x-3 md:space-x-0 rtl:space-x-reverse"
        >
          <button
            v-if="isAuthed"
            type="button"
            class="flex text-sm bg-neutral-primary rounded-full md:me-0 focus:ring-3 focus:ring-green-300"
            id="user-menu-button"
            aria-expanded="false"
            @click="toggleUserMenu"
          >
            <span class="sr-only">Open user menu</span>
            <img
              v-if="user?.avatarUrl"
              class="size-9 rounded-full"
              :src="user?.avatarUrl"
              alt="user photo"
            />
          </button>

          <RouterLink
            v-else
            to="/login"
            class="text-sm px-3 py-1 rounded border hover:bg-gray-100"
            @click="closeMenus"
          >
            Sign In
          </RouterLink>

          <!-- Dropdown menu -->
          <div
            v-if="isUserMenuVisible"
            class="absolute top-full right-0 mt-2 z-50 bg-neutral-primary-medium border border-gray-300 rounded-lg shadow-lg w-64 bg-white text-gray-500"
            id="user-dropdown"
          >
            <div class="px-4 py-3 text-sm border-b border-gray-300">
              <span class="block truncate">{{ user?.email }}</span>
            </div>
            <ul class="p-2 text-sm text-body font-medium" aria-labelledby="user-menu-button">
              <li>
                <RouterLink
                  to="/dashboard"
                  class="inline-flex items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:bg-gray-200 hover:text-gray-900 rounded cursor-pointer"
                  @click="closeMenus"
                >
                  Dashboard
                </RouterLink>
              </li>
              <li>
                <button
                  class="inline-flex items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:bg-gray-200 hover:text-gray-900 rounded cursor-pointer"
                  @click="onSignOut"
                >
                  Sign out
                </button>
              </li>
            </ul>
          </div>
          <button
            data-collapse-toggle="navbar-user"
            type="button"
            class="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-body rounded-base md:hidden hover:bg-neutral-secondary-soft hover:text-heading focus:outline-none focus:ring-2 focus:ring-neutral-tertiary"
            aria-controls="navbar-user"
            aria-expanded="false"
            @click="toggleMenu"
          >
            <span class="sr-only">Open main menu</span>
            <svg
              class="w-6 h-6"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                stroke="currentColor"
                stroke-linecap="round"
                stroke-width="2"
                d="M5 7h14M5 12h14M5 17h14"
              />
            </svg>
          </button>
        </div>
        <div
          :class="[
            { absolute: isMenuVisible },
            isMenuVisible ? 'block top-full' : 'hidden',
            ' items-center justify-between w-full md:flex md:w-auto md:order-1 text-gray-500',
          ]"
          id="navbar-user"
        >
          <ul
            class="font-semibold lg:font-medium flex flex-col p-4 md:p-0 mt-4 border border-gray-300 rounded-lg rounded-base bg-neutral-secondary-soft md:flex-row md:space-x-8 rtl:space-x-reverse md:mt-0 md:border-0 md:bg-neutral-primary bg-gray-50"
          >
            <li>
              <RouterLink
                to="/"
                class="inline-flex items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:bg-gray-200 lg:hover:bg-transparent hover:text-gray-900 lg:hover:text-green-500 rounded cursor-pointer"
                @click="closeMenus"
              >
                Home
              </RouterLink>
            </li>

            <li>
              <RouterLink
                to="/about"
                class="inline-flex items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:bg-gray-200 lg:hover:bg-transparent hover:text-gray-900 lg:hover:text-green-500 rounded cursor-pointer"
                @click="closeMenus"
              >
                About
              </RouterLink>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  </header>
</template>
