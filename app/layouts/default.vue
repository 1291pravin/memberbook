<template>
  <div class="min-h-screen bg-slate-50">
    <header class="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-sm">
      <div class="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        <NuxtLink to="/" class="group inline-flex items-center gap-2.5 rounded-full border border-primary-100 bg-white px-3 py-1.5 text-base font-semibold tracking-tight text-slate-900 transition-colors hover:border-primary-200 sm:text-lg">
          <img src="/logo.png" alt="MemberBook logo" class="h-7 w-7 rounded-md object-contain" />
          <span>MemberBook</span>
        </NuxtLink>

        <nav class="flex items-center gap-2 sm:gap-3">
          <NuxtLink to="/blog" class="hidden rounded-full px-3 py-1.5 text-sm font-medium transition-colors hover:bg-primary-50 hover:text-primary-700 md:inline-flex" :class="navLinkClass('/blog')">Blog</NuxtLink>
          <NuxtLink to="/tools" class="hidden rounded-full px-3 py-1.5 text-sm font-medium transition-colors hover:bg-primary-50 hover:text-primary-700 md:inline-flex" :class="navLinkClass('/tools')">Tools</NuxtLink>
          <NuxtLink to="/contact" class="hidden rounded-full px-3 py-1.5 text-sm font-medium transition-colors hover:bg-primary-50 hover:text-primary-700 md:inline-flex" :class="navLinkClass('/contact')">Contact</NuxtLink>

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

function navLinkClass(path: string) {
  return route.path.startsWith(path) ? "bg-primary-50 text-primary-700" : "text-slate-600";
}

async function logout() {
  await $fetch("/api/auth/logout", { method: "POST" });
  await clear();
  navigateTo("/login");
}
</script>
