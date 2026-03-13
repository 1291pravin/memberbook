<template>
  <div class="min-h-screen bg-slate-50">
    <header class="sticky top-0 z-40 border-b border-slate-200/60 bg-white/80 backdrop-blur-lg">
      <div class="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        <NuxtLink to="/" class="group inline-flex items-center gap-2.5 rounded-full border border-primary-100 bg-white px-3 py-1.5 text-base font-semibold tracking-tight text-slate-900 shadow-sm transition-all hover:border-primary-200 hover:shadow-md sm:text-lg">
          <img src="/logo.png" alt="MemberBook logo" class="h-7 w-7 rounded-md object-contain" />
          <span>MemberBook</span>
        </NuxtLink>

        <!-- Desktop nav -->
        <nav class="hidden items-center gap-1 md:flex">
          <NuxtLink to="/blog" class="rounded-full px-3 py-1.5 text-sm font-medium transition-all duration-200 hover:bg-primary-50 hover:text-primary-700" :class="navLinkClass('/blog')">Blog</NuxtLink>
          <NuxtLink to="/tools" class="rounded-full px-3 py-1.5 text-sm font-medium transition-all duration-200 hover:bg-primary-50 hover:text-primary-700" :class="navLinkClass('/tools')">Tools</NuxtLink>
          <NuxtLink to="/contact" class="rounded-full px-3 py-1.5 text-sm font-medium transition-all duration-200 hover:bg-primary-50 hover:text-primary-700" :class="navLinkClass('/contact')">Contact</NuxtLink>

          <template v-if="loggedIn">
            <NuxtLink to="/dashboard" class="rounded-full px-3 py-1.5 text-sm font-medium transition-all duration-200 hover:bg-primary-50 hover:text-primary-700" :class="navLinkClass('/dashboard')">Dashboard</NuxtLink>
            <button class="rounded-full px-3 py-1.5 text-sm font-medium text-slate-600 transition-all duration-200 hover:bg-slate-100 hover:text-slate-900 cursor-pointer" @click="logout">Logout</button>
          </template>
          <template v-else>
            <NuxtLink to="/login" class="rounded-full px-3 py-1.5 text-sm font-medium text-slate-600 transition-all duration-200 hover:bg-slate-100 hover:text-slate-900 ml-1">Login</NuxtLink>
            <NuxtLink to="/register" class="ml-1">
              <AppButton size="sm">Get Started</AppButton>
            </NuxtLink>
          </template>
        </nav>

        <!-- Mobile nav -->
        <div class="flex items-center gap-2 md:hidden">
          <template v-if="loggedIn">
            <NuxtLink to="/dashboard" class="rounded-full px-3 py-1.5 text-sm font-medium transition-colors hover:bg-primary-50 hover:text-primary-700" :class="navLinkClass('/dashboard')">Dashboard</NuxtLink>
          </template>
          <template v-else>
            <NuxtLink to="/login" class="rounded-full px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900">Login</NuxtLink>
          </template>
          <button class="rounded-lg p-1.5 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 cursor-pointer" @click="mobileMenuOpen = !mobileMenuOpen" aria-label="Toggle menu">
            <svg v-if="!mobileMenuOpen" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Mobile menu dropdown -->
      <Transition
        enter-active-class="transition-all duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-2"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition-all duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-2"
      >
        <div v-if="mobileMenuOpen" class="border-t border-slate-200/60 bg-white px-4 py-3 md:hidden">
          <div class="flex flex-col gap-1">
            <NuxtLink to="/blog" class="rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-primary-50 hover:text-primary-700" :class="navLinkClass('/blog')" @click="mobileMenuOpen = false">Blog</NuxtLink>
            <NuxtLink to="/tools" class="rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-primary-50 hover:text-primary-700" :class="navLinkClass('/tools')" @click="mobileMenuOpen = false">Tools</NuxtLink>
            <NuxtLink to="/contact" class="rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-primary-50 hover:text-primary-700" :class="navLinkClass('/contact')" @click="mobileMenuOpen = false">Contact</NuxtLink>
            <template v-if="loggedIn">
              <button class="rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 cursor-pointer" @click="mobileMenuOpen = false; logout()">Logout</button>
            </template>
            <template v-else>
              <NuxtLink to="/register" class="rounded-lg px-3 py-2 text-sm font-medium text-primary-600 transition-colors hover:bg-primary-50 hover:text-primary-700" @click="mobileMenuOpen = false">Get Started</NuxtLink>
            </template>
          </div>
        </div>
      </Transition>
    </header>
    <main>
      <slot />
    </main>
    <footer class="border-t border-slate-200 bg-white py-10 text-center">
      <div class="max-w-4xl mx-auto px-4">
        <p class="text-sm font-medium text-slate-700 mb-3">
          MemberBook &mdash; Simple member management for small businesses.
        </p>
        <div class="flex gap-4 justify-center flex-wrap text-sm text-slate-600">
          <NuxtLink to="/features" class="hover:text-primary-600 transition-colors">Features</NuxtLink>
          <span class="text-slate-300">&middot;</span>
          <NuxtLink to="/blog" class="hover:text-primary-600 transition-colors">Blog</NuxtLink>
          <span class="text-slate-300">&middot;</span>
          <NuxtLink to="/about" class="hover:text-primary-600 transition-colors">About</NuxtLink>
          <span class="text-slate-300">&middot;</span>
          <NuxtLink to="/contact" class="hover:text-primary-600 transition-colors">Contact</NuxtLink>
          <span class="text-slate-300">&middot;</span>
          <NuxtLink to="/privacy" class="hover:text-primary-600 transition-colors">Privacy Policy</NuxtLink>
          <span class="text-slate-300">&middot;</span>
          <NuxtLink to="/terms" class="hover:text-primary-600 transition-colors">Terms of Service</NuxtLink>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const { loggedIn, clear } = useUserSession();
const mobileMenuOpen = ref(false);

watch(() => route.path, () => {
  mobileMenuOpen.value = false;
});

function navLinkClass(path: string) {
  return route.path.startsWith(path) ? "bg-primary-50 text-primary-700" : "text-slate-600";
}

async function logout() {
  await $fetch("/api/auth/logout", { method: "POST" });
  await clear();
  navigateTo("/login");
}
</script>
