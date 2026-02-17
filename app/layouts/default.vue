<template>
  <div class="min-h-screen bg-slate-50">
    <header class="bg-white border-b border-slate-200">
      <div class="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <NuxtLink to="/" class="text-xl font-bold text-primary-600">MemberBook</NuxtLink>
        <nav class="flex items-center gap-4">
          <NuxtLink to="/blog" class="hidden sm:block text-sm text-slate-600 hover:text-slate-900">Blog</NuxtLink>
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
