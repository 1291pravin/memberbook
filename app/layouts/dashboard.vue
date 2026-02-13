<template>
  <div class="min-h-screen bg-slate-50 lg:flex">
    <!-- Desktop Sidebar -->
    <aside class="hidden lg:flex lg:flex-col lg:w-64 lg:bg-slate-800 lg:fixed lg:inset-y-0">
      <div class="p-4 border-b border-slate-700">
        <NuxtLink to="/dashboard" class="text-xl font-bold text-primary-300">MemberBook</NuxtLink>
        <p v-if="currentOrg" class="text-xs text-slate-500 mt-1">{{ currentOrg.name }}</p>
      </div>
      <nav class="flex-1 p-3 space-y-1">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          :class="isActive(item.to) ? 'bg-[rgba(99,102,241,0.15)] text-primary-200' : 'text-slate-400 hover:bg-[rgba(148,163,184,0.1)]'"
        >
          <component :is="item.icon" class="w-5 h-5" />
          {{ item.label }}
        </NuxtLink>
      </nav>
      <div class="p-3 border-t border-slate-700">
        <button
          class="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-[rgba(148,163,184,0.1)]"
          @click="logout"
        >
          Logout
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <div class="flex-1 pb-20 lg:pb-0 lg:ml-64">
      <!-- Mobile Header -->
      <header class="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <NuxtLink to="/dashboard" class="text-lg font-bold text-primary-600">MemberBook</NuxtLink>
        <div class="flex items-center gap-2">
          <p v-if="currentOrg" class="text-xs text-slate-500">{{ currentOrg.name }}</p>
          <div class="relative">
            <button
              class="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
              @click="mobileMenuOpen = !mobileMenuOpen"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
              </svg>
            </button>
            <div
              v-if="mobileMenuOpen"
              class="absolute right-0 mt-1 w-44 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50"
            >
              <NuxtLink
                to="/dashboard/settings"
                class="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                @click="mobileMenuOpen = false"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </NuxtLink>
              <button
                class="flex items-center gap-2 w-full px-4 py-2 text-sm text-danger-600 hover:bg-slate-50"
                @click="logout"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div class="max-w-5xl mx-auto">
        <slot />
      </div>
    </div>

    <!-- Mobile Bottom Tab Bar -->
    <nav class="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 flex justify-around py-2 z-40">
      <NuxtLink
        v-for="item in mobileNavItems"
        :key="item.to"
        :to="item.to"
        class="relative flex flex-col items-center gap-0.5 px-2 py-1 text-xs"
        :class="isActive(item.to) ? 'text-primary-600' : 'text-slate-500'"
      >
        <span
          v-if="isActive(item.to)"
          class="absolute -top-2 left-1/2 -translate-x-1/2 w-10 h-1 bg-primary-500 rounded-full"
        />
        <component :is="item.icon" class="w-5 h-5" />
        {{ item.label }}
      </NuxtLink>

      <!-- More Button -->
      <button
        class="relative flex flex-col items-center gap-0.5 px-2 py-1 text-xs"
        :class="moreMenuOpen ? 'text-primary-600' : 'text-slate-500'"
        @click="moreMenuOpen = !moreMenuOpen"
      >
        <span
          v-if="moreMenuOpen"
          class="absolute -top-2 left-1/2 -translate-x-1/2 w-10 h-1 bg-primary-500 rounded-full"
        />
        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
        More
      </button>
    </nav>

    <!-- More Menu Bottom Sheet -->
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="moreMenuOpen"
        class="lg:hidden fixed inset-0 bg-black/40 z-50"
        @click="moreMenuOpen = false"
      >
        <Transition
          enter-active-class="transition-transform duration-300 ease-out"
          enter-from-class="translate-y-full"
          enter-to-class="translate-y-0"
          leave-active-class="transition-transform duration-200 ease-in"
          leave-from-class="translate-y-0"
          leave-to-class="translate-y-full"
        >
          <div
            v-if="moreMenuOpen"
            class="absolute bottom-0 inset-x-0 bg-white rounded-t-2xl shadow-2xl"
            @click.stop
          >
            <!-- Drag Handle -->
            <div class="flex justify-center pt-3 pb-2">
              <div class="w-10 h-1 bg-slate-300 rounded-full" />
            </div>

            <!-- Header -->
            <div class="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <h3 class="text-lg font-semibold text-slate-800">Menu</h3>
              <button
                class="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
                @click="moreMenuOpen = false"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Menu Items Grid -->
            <div class="grid grid-cols-3 gap-3 p-4 pb-6">
              <NuxtLink
                v-for="item in moreNavItems"
                :key="item.to"
                :to="item.to"
                class="flex flex-col items-center gap-2 p-3 rounded-xl transition-colors"
                :class="isActive(item.to) ? 'bg-primary-50 text-primary-600' : 'text-slate-600 hover:bg-slate-50'"
                @click="moreMenuOpen = false"
              >
                <component :is="item.icon" class="w-7 h-7" />
                <span class="text-xs font-medium text-center">{{ item.label }}</span>
              </NuxtLink>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { h, onMounted, onUnmounted } from "vue";

// Prevent indexing of all dashboard pages
useSeoMeta({
  robots: "noindex, nofollow",
});

const route = useRoute();
const { clear } = useUserSession();
const { currentOrg } = useOrg();
const t = useTerminology();
const mobileMenuOpen = ref(false);
const moreMenuOpen = ref(false);

function closeMobileMenu(e: MouseEvent) {
  if (!(e.target as HTMLElement).closest(".relative")) {
    mobileMenuOpen.value = false;
  }
}
onMounted(() => document.addEventListener("click", closeMobileMenu));
onUnmounted(() => document.removeEventListener("click", closeMobileMenu));
watch(() => route.path, () => {
  mobileMenuOpen.value = false;
  moreMenuOpen.value = false;
});

function icon(d: string) {
  return () => h("svg", { class: "w-5 h-5", fill: "none", stroke: "currentColor", "stroke-width": "1.5", viewBox: "0 0 24 24" }, [
    h("path", { "stroke-linecap": "round", "stroke-linejoin": "round", d }),
  ]);
}

const navItems = computed(() => [
  { to: "/dashboard", label: "Dashboard", icon: icon("M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1") },
  { to: "/dashboard/members", label: t.value.members, icon: icon("M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z") },
  { to: "/dashboard/plans", label: "Plans", icon: icon("M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z") },
  { to: "/dashboard/payments", label: "Payments", icon: icon("M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z") },
  { to: "/dashboard/expenses", label: "Expenses", icon: icon("M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z") },
  { to: "/dashboard/check-ins", label: "Check-Ins", icon: icon("M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z") },
  { to: "/dashboard/seats", label: "Seats", icon: icon("M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z") },
  { to: "/dashboard/inquiries", label: "Inquiries", icon: icon("M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z") },
  { to: "/dashboard/analytics", label: "Analytics", icon: icon("M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z") },
  { to: "/dashboard/settings", label: "Settings", icon: icon("M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z M15 12a3 3 0 11-6 0 3 3 0 016 0z") },
]);

// Core items always visible in bottom nav
const mobileNavItems = computed(() => [
  navItems.value[0], // Dashboard
  navItems.value[1], // Members
  navItems.value[3], // Payments
]);

// Items in the "More" menu
const moreNavItems = computed(() => [
  navItems.value[2], // Plans
  navItems.value[4], // Expenses
  navItems.value[5], // Check-Ins
  navItems.value[6], // Seats
  navItems.value[7], // Inquiries
  navItems.value[8], // Analytics
  navItems.value[9], // Settings
]);

function isActive(to: string) {
  if (to === "/dashboard") return route.path === "/dashboard";
  return route.path.startsWith(to);
}

async function logout() {
  await $fetch("/api/auth/logout", { method: "POST" });
  await clear();
  navigateTo("/");
}
</script>
