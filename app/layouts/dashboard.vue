<template>
  <div class="dashboard-shell min-h-screen bg-slate-50 lg:flex">
    <!-- Desktop sidebar -->
    <aside class="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-slate-200 lg:bg-white">
      <div class="px-5 pb-4 pt-6">
        <NuxtLink to="/dashboard" class="flex items-center gap-2.5" aria-label="memberbook home">
          <BrandMark :size="32" />
          <span class="text-[21px] font-extrabold tracking-[-0.035em] text-slate-800">memberbook</span>
        </NuxtLink>
        <div v-if="currentOrg" class="relative mt-4">
          <button
            class="flex w-full items-center justify-between gap-2 rounded-2xl bg-slate-50 px-3 py-2.5 text-left text-sm font-semibold text-slate-800 hover:bg-slate-100"
            @click.stop="orgDropdownOpen = !orgDropdownOpen"
          >
            <span class="truncate">{{ currentOrg.name }}</span>
            <svg class="h-4 w-4 shrink-0 text-slate-600" :class="orgDropdownOpen ? 'rotate-180' : ''" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
          <div v-if="orgDropdownOpen" class="absolute left-0 top-full z-50 mt-1 w-full rounded-2xl border border-slate-200 bg-white py-1 shadow-lg">
            <button
              v-for="org in userOrgs"
              :key="org.orgId"
              class="flex w-full items-center justify-between px-3 py-2 text-sm"
              :class="org.orgId === currentOrg.orgId ? 'bg-primary-50 text-primary-800' : 'text-slate-700 hover:bg-slate-50'"
              @click="switchOrg(org.orgId)"
            >
              <span class="truncate">{{ org.name }}</span>
              <span class="ml-2 shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold" :class="org.role === 'owner' ? 'bg-primary-100 text-primary-800' : 'bg-slate-100 text-slate-700'">{{ org.role === 'owner' ? 'Owner' : 'Staff' }}</span>
            </button>
            <div class="my-1 border-t border-slate-200" />
            <button class="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50" @click="openAddOutlet">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              Add another branch
            </button>
          </div>
        </div>
      </div>

      <nav class="flex-1 space-y-1 overflow-y-auto px-3 pb-4" aria-label="Main">
        <NuxtLink v-for="item in mainNav" :key="item.to" :to="item.to" class="app-nav-link" :class="{ 'is-active': isActive(item.to) }">
          <component :is="item.icon" class="h-5 w-5" />
          {{ item.label }}
        </NuxtLink>

        <button type="button" class="app-nav-link w-full" :aria-expanded="moreOpen" @click="moreOpen = !moreOpen">
          <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h10" /></svg>
          <span class="flex-1 text-left">More</span>
          <svg class="h-4 w-4" :class="moreOpen ? 'rotate-180' : ''" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
        </button>
        <div v-if="moreOpen" class="space-y-1 pl-4">
          <NuxtLink v-for="item in extraNav" :key="item.to" :to="item.to" class="app-nav-link !py-2 !text-sm" :class="{ 'is-active': isActive(item.to) }">
            <component :is="item.icon" class="h-[18px] w-[18px]" />
            {{ item.label }}
          </NuxtLink>
        </div>

        <NuxtLink to="/dashboard/upload" class="mt-5 block rounded-3xl bg-accent-100 p-4 text-sm leading-snug text-slate-800 hover:bg-accent-200">
          <span class="serif-accent block text-[22px] leading-tight text-slate-800">Send us your data</span>
          <span class="mt-1 block text-slate-700">New {{ t.membersLower }} or a register photo? Send it and we'll add it.</span>
        </NuxtLink>
      </nav>

      <div class="space-y-1 border-t border-slate-200 p-3">
        <NuxtLink v-for="item in footerNav" :key="item.to" :to="item.to" class="app-nav-link !py-2 !text-sm" :class="{ 'is-active': isActive(item.to) }">
          <component :is="item.icon" class="h-[18px] w-[18px]" />
          {{ item.label }}
        </NuxtLink>
        <button class="app-nav-link w-full !py-2 !text-sm" @click="logout">
          <svg class="h-[18px] w-[18px]" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>
          Log out
        </button>
      </div>
    </aside>

    <!-- Main content -->
    <div class="flex-1 pb-24 lg:ml-64 lg:pb-0">
      <!-- Mobile header -->
      <header class="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
        <NuxtLink to="/dashboard" class="flex items-center gap-2" aria-label="memberbook home">
          <BrandMark :size="28" />
          <span class="text-lg font-extrabold tracking-[-0.035em] text-slate-800">memberbook</span>
        </NuxtLink>
        <div v-if="currentOrg" class="relative">
          <button
            class="flex max-w-[11rem] items-center gap-1 rounded-full bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700"
            @click.stop="mobileOrgDropdownOpen = !mobileOrgDropdownOpen"
          >
            <span class="truncate">{{ currentOrg.name }}</span>
            <svg class="h-3 w-3 shrink-0" :class="mobileOrgDropdownOpen ? 'rotate-180' : ''" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
          </button>
          <div v-if="mobileOrgDropdownOpen" class="absolute right-0 top-full z-50 mt-1 w-56 rounded-2xl border border-slate-200 bg-white py-1 shadow-lg">
            <button
              v-for="org in userOrgs"
              :key="org.orgId"
              class="flex w-full items-center justify-between px-3 py-2 text-sm"
              :class="org.orgId === currentOrg.orgId ? 'bg-primary-50 text-primary-800' : 'text-slate-700 hover:bg-slate-50'"
              @click="switchOrg(org.orgId)"
            >
              <span class="truncate">{{ org.name }}</span>
            </button>
            <div class="my-1 border-t border-slate-200" />
            <button class="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50" @click="openAddOutlet">Add another branch</button>
          </div>
        </div>
      </header>

      <div class="mx-auto w-full max-w-7xl">
        <slot />
      </div>
    </div>

    <!-- Mobile bottom tab bar -->
    <nav class="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-slate-200 bg-white px-2 pt-1 lg:hidden" style="padding-bottom: max(0.5rem, env(safe-area-inset-bottom));" aria-label="Main">
      <NuxtLink
        v-for="item in mainNav"
        :key="item.to"
        :to="item.to"
        class="flex min-h-[52px] min-w-[56px] flex-col items-center justify-center gap-0.5 rounded-2xl px-2 text-[11px] font-semibold"
        :class="isActive(item.to) ? 'text-primary-700' : 'text-slate-600'"
      >
        <span class="flex h-7 w-12 items-center justify-center rounded-full" :class="isActive(item.to) ? 'bg-primary-100' : ''">
          <component :is="item.icon" class="h-5 w-5" />
        </span>
        {{ item.label }}
      </NuxtLink>
      <button
        class="flex min-h-[52px] min-w-[56px] flex-col items-center justify-center gap-0.5 rounded-2xl px-2 text-[11px] font-semibold"
        :class="moreMenuOpen ? 'text-primary-700' : 'text-slate-600'"
        @click="moreMenuOpen = !moreMenuOpen"
      >
        <span class="flex h-7 w-12 items-center justify-center rounded-full" :class="moreMenuOpen ? 'bg-primary-100' : ''">
          <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
        </span>
        More
      </button>
    </nav>

    <!-- Mobile "More" sheet -->
    <Transition enter-active-class="transition-opacity duration-200" enter-from-class="opacity-0" leave-active-class="transition-opacity duration-150" leave-to-class="opacity-0">
      <div v-if="moreMenuOpen" class="fixed inset-0 z-50 bg-black/40 lg:hidden" @click="moreMenuOpen = false">
        <div class="absolute inset-x-0 bottom-0 rounded-t-[28px] bg-white pb-6 shadow-2xl" @click.stop>
          <div class="flex justify-center pb-2 pt-3"><div class="h-1 w-10 rounded-full bg-slate-300" /></div>
          <div class="flex items-center justify-between px-5 pb-2">
            <h3 class="text-lg font-extrabold text-slate-800">More</h3>
            <button class="rounded-full p-2 text-slate-600 hover:bg-slate-100" aria-label="Close menu" @click="moreMenuOpen = false">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <NuxtLink to="/dashboard/upload" class="mx-4 mb-3 block rounded-3xl bg-accent-100 p-4 text-sm text-slate-800" @click="moreMenuOpen = false">
            <span class="serif-accent block text-xl">Send us your data</span>
            <span class="text-slate-700">We'll add new {{ t.membersLower }} for you.</span>
          </NuxtLink>
          <div class="grid grid-cols-3 gap-2 px-4">
            <NuxtLink
              v-for="item in [...extraNav, ...footerNav]"
              :key="item.to"
              :to="item.to"
              class="flex flex-col items-center gap-2 rounded-2xl p-3 text-center"
              :class="isActive(item.to) ? 'bg-primary-50 text-primary-800' : 'text-slate-700 hover:bg-slate-50'"
              @click="moreMenuOpen = false"
            >
              <component :is="item.icon" class="h-6 w-6" />
              <span class="text-xs font-semibold">{{ item.label }}</span>
            </NuxtLink>
            <button class="flex flex-col items-center gap-2 rounded-2xl p-3 text-center text-slate-700 hover:bg-slate-50" @click="logout">
              <svg class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>
              <span class="text-xs font-semibold">Log out</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Support WhatsApp button (hidden on the help page, which has its own) -->
    <SupportWhatsAppButton v-if="route.path !== '/dashboard/help'" />

    <AddOutletModal :open="addOutletOpen" @close="addOutletOpen = false" @created="onOutletCreated" />
  </div>
</template>

<script setup lang="ts">
import { h, onMounted, onUnmounted } from "vue";

// Prevent indexing of all dashboard pages
useSeoMeta({
  robots: "noindex, nofollow",
});

const route = useRoute();
const { clear, fetch: refreshSession } = useUserSession();
const { currentOrg } = useOrg();
const t = useTerminology();
const moreMenuOpen = ref(false);
const orgDropdownOpen = ref(false);
const mobileOrgDropdownOpen = ref(false);
const userOrgs = ref<{ orgId: number; name: string; slug: string; type: string; role: string }[]>([]);
const hasMultipleOrgs = ref(false);
const addOutletOpen = ref(false);

function openAddOutlet() {
  orgDropdownOpen.value = false;
  mobileOrgDropdownOpen.value = false;
  addOutletOpen.value = true;
}

async function onOutletCreated() {
  addOutletOpen.value = false;
  await fetchUserOrgs();
}

async function fetchUserOrgs() {
  try {
    const { orgs } = await $fetch("/api/orgs");
    userOrgs.value = orgs;
    hasMultipleOrgs.value = orgs.length > 1;
  }
  catch {
    // silently fail — single org experience
  }
}

async function switchOrg(orgId: number) {
  if (orgId === currentOrg.value?.orgId) {
    orgDropdownOpen.value = false;
    mobileOrgDropdownOpen.value = false;
    return;
  }
  await $fetch("/api/orgs/switch", { method: "POST", body: { orgId } });
  await refreshSession();
  orgDropdownOpen.value = false;
  mobileOrgDropdownOpen.value = false;
  navigateTo("/dashboard");
}

function closeDropdowns(e: MouseEvent) {
  if (!(e.target as HTMLElement).closest(".relative")) {
    orgDropdownOpen.value = false;
    mobileOrgDropdownOpen.value = false;
  }
}
onMounted(() => {
  document.addEventListener("click", closeDropdowns);
  fetchUserOrgs();
});
onUnmounted(() => document.removeEventListener("click", closeDropdowns));
watch(() => route.path, () => {
  moreMenuOpen.value = false;
  orgDropdownOpen.value = false;
  mobileOrgDropdownOpen.value = false;
});

function icon(d: string) {
  return () => h("svg", { class: "w-5 h-5", fill: "none", stroke: "currentColor", "stroke-width": "1.8", viewBox: "0 0 24 24", "aria-hidden": "true" }, [
    h("path", { "stroke-linecap": "round", "stroke-linejoin": "round", d }),
  ]);
}

const isLibrary = computed(() => currentOrg.value?.type === "library");

// The four things an owner does every day.
const mainNav = computed(() => [
  { to: "/dashboard", label: "Home", icon: icon("M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1z") },
  { to: "/dashboard/members", label: t.value.members, icon: icon("M9 11a4 4 0 100-8 4 4 0 000 8zM2.5 21a6.5 6.5 0 0113 0M16 3.5a4 4 0 010 7.5M18 14a5.5 5.5 0 013.5 7") },
  { to: "/dashboard/collections", label: "Fees due", icon: icon("M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0") },
  { to: "/dashboard/payments", label: "Payments", icon: icon("M3 7h18v12H3zM3 11h18M7 15h3") },
]);

// Everything else lives under "More" so the main menu stays short.
const extraNav = computed(() => {
  const items = [
    { to: "/dashboard/add-ons", label: "Add-ons", icon: icon("M12 4.5v15m7.5-7.5h-15M4.5 4.5h15v15h-15z") },
    { to: "/dashboard/plans", label: "Plans", icon: icon("M4 6h16M4 12h16M4 18h10") },
    { to: "/dashboard/check-ins", label: "Check-ins", icon: icon("M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z") },
    { to: "/dashboard/inquiries", label: "Enquiries", icon: icon("M21 12a8 8 0 01-11.6 7.1L4 20l1-4.6A8 8 0 1121 12z") },
    { to: "/dashboard/expenses", label: "Expenses", icon: icon("M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z") },
    { to: "/dashboard/analytics", label: "Reports", icon: icon("M4 19V9M10 19V5M16 19v-7M22 19H2") },
  ];
  if (isLibrary.value) {
    items.splice(1, 0, { to: "/dashboard/seats", label: "Seats", icon: icon("M5 21V10a2 2 0 012-2h10a2 2 0 012 2v11M3 21h18M8 8V5a4 4 0 018 0v3") });
  }
  return items;
});

const footerNav = computed(() => [
  { to: "/dashboard/settings", label: "Settings", icon: icon("M10.3 4.3a1.7 1.7 0 013.4 0l.2 1a1.7 1.7 0 002.5 1.1l.9-.5a1.7 1.7 0 012.4 2.4l-.5.9a1.7 1.7 0 001.1 2.5l1 .2a1.7 1.7 0 010 3.4l-1 .2a1.7 1.7 0 00-1.1 2.5l.5.9a1.7 1.7 0 01-2.4 2.4l-.9-.5a1.7 1.7 0 00-2.5 1.1l-.2 1a1.7 1.7 0 01-3.4 0l-.2-1a1.7 1.7 0 00-2.5-1.1l-.9.5a1.7 1.7 0 01-2.4-2.4l.5-.9a1.7 1.7 0 00-1.1-2.5l-1-.2a1.7 1.7 0 010-3.4l1-.2a1.7 1.7 0 001.1-2.5l-.5-.9a1.7 1.7 0 012.4-2.4l.9.5a1.7 1.7 0 002.5-1.1zM15 12a3 3 0 11-6 0 3 3 0 016 0z") },
  { to: "/dashboard/help", label: "Help", icon: icon("M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z") },
]);

// Keep "More" open on desktop when the current page lives inside it.
const moreOpen = ref(false);
watch(() => route.path, (path) => {
  if (extraNav.value.some(i => path.startsWith(i.to))) moreOpen.value = true;
}, { immediate: true });

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
