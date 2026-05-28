<template>
  <div class="dashboard-shell min-h-screen bg-slate-50">
    <header class="border-b border-slate-200 bg-white">
      <div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <NuxtLink to="/admin/usage" class="text-base font-bold text-slate-800">
          MemberBook Admin
        </NuxtLink>
        <nav class="flex items-center gap-2">
          <NuxtLink
            to="/admin/usage"
            class="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Usage
          </NuxtLink>
          <AppButton size="sm" variant="ghost" @click="logout">
            Logout
          </AppButton>
        </nav>
      </div>
    </header>
    <main class="mx-auto max-w-7xl px-4 py-6">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
useSeoMeta({
  robots: "noindex, nofollow",
});

async function logout() {
  await $fetch("/api/admin/logout", { method: "POST" });
  await navigateTo("/admin");
}
</script>
