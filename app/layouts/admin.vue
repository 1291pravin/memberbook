<template>
  <div class="admin-shell min-h-screen lg:flex">
    <aside class="admin-sidebar flex flex-wrap items-center gap-1 border-b px-3 py-2 lg:sticky lg:top-0 lg:h-screen lg:w-60 lg:shrink-0 lg:flex-col lg:flex-nowrap lg:items-stretch lg:border-b-0 lg:border-r lg:px-3.5 lg:py-5">
      <NuxtLink to="/admin/usage" class="mr-3 flex items-center gap-2.5 px-2.5 py-1 lg:mr-0 lg:pb-5">
        <span class="admin-logo flex h-7 w-7 items-center justify-center rounded-md text-sm font-bold">M</span>
        <span class="flex flex-col leading-tight">
          <span class="text-sm font-semibold">MemberBook</span>
          <span class="admin-muted text-xs">Admin</span>
        </span>
      </NuxtLink>

      <NuxtLink
        v-for="item in nav"
        :key="item.to"
        :to="item.to"
        class="admin-nav-link flex min-h-10 items-center gap-2.5 rounded-lg px-2.5 text-sm font-medium"
        active-class="admin-nav-link--active"
      >
        <svg class="h-[18px] w-[18px] shrink-0" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" aria-hidden="true">
          <path :d="item.icon" />
        </svg>
        {{ item.label }}
      </NuxtLink>

      <div class="hidden flex-1 lg:block" />

      <button
        type="button"
        class="admin-nav-link ml-auto flex min-h-10 cursor-pointer items-center gap-2.5 rounded-lg px-2.5 text-sm lg:ml-0"
        @click="logout"
      >
        <svg class="h-[18px] w-[18px] shrink-0" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10" />
        </svg>
        Log out
      </button>
    </aside>

    <main class="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-7">
      <div class="mx-auto max-w-[1240px]">
        <slot />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
useSeoMeta({
  robots: "noindex, nofollow",
});

useHead({
  link: [
    { rel: "preconnect", href: "https://fonts.googleapis.com" },
    { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" },
    { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" },
  ],
});

const nav = [
  { to: "/admin/usage", label: "Usage", icon: "M4 20V10M10 20V4M16 20v-7M22 20H2" },
  { to: "/admin/setup", label: "Set up", icon: "M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" },
  { to: "/admin/inbox", label: "Inbox", icon: "M4 4h16v12H8l-4 4z" },
];

async function logout() {
  await $fetch("/api/admin/logout", { method: "POST" });
  await navigateTo("/admin");
}
</script>
