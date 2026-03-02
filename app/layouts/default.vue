<template>
  <div class="min-h-screen bg-slate-50">
    <header class="bg-white border-b border-slate-200">
      <div class="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <NuxtLink to="/" class="text-xl font-bold text-primary-600">MemberBook</NuxtLink>
        <nav class="flex items-center gap-4">
          <NuxtLink to="/blog" class="hidden sm:block text-sm text-slate-600 hover:text-slate-900">Blog</NuxtLink>
          <NuxtLink to="/tools" class="hidden sm:block text-sm text-slate-600 hover:text-slate-900">Tools</NuxtLink>
          <NuxtLink to="/contact" class="hidden sm:block text-sm text-slate-600 hover:text-slate-900">Contact</NuxtLink>
          <template v-if="loggedIn">
            <NuxtLink to="/dashboard" class="text-sm text-slate-600 hover:text-slate-900">Dashboard</NuxtLink>
            <button class="text-sm text-slate-600 hover:text-slate-900" @click="logout">Logout</button>
          </template>
          <template v-else>
            <NuxtLink to="/login" class="text-sm text-slate-600 hover:text-slate-900">Login</NuxtLink>
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
const { loggedIn, clear } = useUserSession();

async function logout() {
  await $fetch("/api/auth/logout", { method: "POST" });
  await clear();
  navigateTo("/login");
}
</script>
