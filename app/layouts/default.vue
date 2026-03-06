<template>
  <div class="min-h-screen bg-slate-50">
    <header class="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-sm">
      <div class="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        <NuxtLink to="/" class="group inline-flex items-center gap-2.5 rounded-full border border-primary-100 bg-white px-3 py-1.5 text-base font-semibold tracking-tight text-slate-900 transition-colors hover:border-primary-200 sm:text-lg">
          <img src="/logo.png" alt="MemberBook logo" class="h-7 w-7 rounded-md object-contain" />
          <span>MemberBook</span>
        </NuxtLink>

        <!-- Desktop nav -->
        <nav class="hidden items-center gap-2 sm:gap-3 md:flex">
          <NuxtLink to="/blog" class="rounded-full px-3 py-1.5 text-sm font-medium transition-colors hover:bg-primary-50 hover:text-primary-700" :class="navLinkClass('/blog')">Blog</NuxtLink>
          <NuxtLink to="/tools" class="rounded-full px-3 py-1.5 text-sm font-medium transition-colors hover:bg-primary-50 hover:text-primary-700" :class="navLinkClass('/tools')">Tools</NuxtLink>
          <NuxtLink to="/contact" class="rounded-full px-3 py-1.5 text-sm font-medium transition-colors hover:bg-primary-50 hover:text-primary-700" :class="navLinkClass('/contact')">Contact</NuxtLink>

          <template v-if="loggedIn">
            <NuxtLink to="/dashboard" class="rounded-full px-3 py-1.5 text-sm font-medium transition-colors hover:bg-primary-50 hover:text-primary-700" :class="navLinkClass('/dashboard')">Dashboard</NuxtLink>
            <button class="rounded-full px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900" @click="logout">Logout</button>
          </template>
          <template v-else>
            <NuxtLink to="/login" class="rounded-full px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900">Login</NuxtLink>
            <NuxtLink to="/register">
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
          <button class="rounded-lg p-1.5 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900" @click="mobileMenuOpen = !mobileMenuOpen" aria-label="Toggle menu">
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
      <div v-if="mobileMenuOpen" class="border-t border-slate-200/80 bg-white px-4 py-3 md:hidden">
        <div class="flex flex-col gap-1">
          <NuxtLink to="/blog" class="rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-primary-50 hover:text-primary-700" :class="navLinkClass('/blog')" @click="mobileMenuOpen = false">Blog</NuxtLink>
          <NuxtLink to="/tools" class="rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-primary-50 hover:text-primary-700" :class="navLinkClass('/tools')" @click="mobileMenuOpen = false">Tools</NuxtLink>
          <NuxtLink to="/contact" class="rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-primary-50 hover:text-primary-700" :class="navLinkClass('/contact')" @click="mobileMenuOpen = false">Contact</NuxtLink>
          <template v-if="loggedIn">
            <button class="rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900" @click="mobileMenuOpen = false; logout()">Logout</button>
          </template>
          <template v-else>
            <NuxtLink to="/register" class="rounded-lg px-3 py-2 text-sm font-medium text-primary-600 transition-colors hover:bg-primary-50 hover:text-primary-700" @click="mobileMenuOpen = false">Get Started</NuxtLink>
          </template>
        </div>
      </div>
    </header>
    <main>
      <slot />
    </main>
    <footer class="border-t border-slate-200 py-8 text-center text-sm text-slate-600">
      <div class="mb-3">
        MemberBook &mdash; Simple member management for small businesses.
      </div>
      <div class="flex gap-4 justify-center flex-wrap">
        <NuxtLink to="/features" class="hover:text-primary-600">Features</NuxtLink>
        <span>&middot;</span>
        <NuxtLink to="/blog" class="hover:text-primary-600">Blog</NuxtLink>
        <span>&middot;</span>
        <NuxtLink to="/about" class="hover:text-primary-600">About</NuxtLink>
        <span>&middot;</span>
        <NuxtLink to="/contact" class="hover:text-primary-600">Contact</NuxtLink>
        <span>&middot;</span>
        <NuxtLink to="/privacy" class="hover:text-primary-600">Privacy Policy</NuxtLink>
        <span>&middot;</span>
        <NuxtLink to="/terms" class="hover:text-primary-600">Terms of Service</NuxtLink>
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
