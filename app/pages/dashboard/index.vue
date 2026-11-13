<template>
  <div class="space-y-6 p-4 lg:p-8">
    <!-- Greeting -->
    <header class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="text-sm font-semibold text-slate-600">{{ todayLabel }}</p>
        <h1 class="mt-1 text-3xl font-extrabold leading-tight tracking-tight text-slate-800 sm:text-4xl">
          {{ greeting }}.
          <span class="serif-accent text-primary-600">{{ headline }}</span>
        </h1>
      </div>
      <div v-if="realMembers > 0" class="flex flex-wrap gap-2">
        <NuxtLink to="/dashboard/members/new" class="app-pill-btn app-pill-btn--ghost">{{ t.addMember }}</NuxtLink>
        <NuxtLink to="/dashboard/payments" class="app-pill-btn app-pill-btn--ghost">Record payment</NuxtLink>
        <NuxtLink v-if="nudgeCount > 0" to="/dashboard/collections" class="app-pill-btn">Send reminders</NuxtLink>
      </div>
    </header>

    <!-- Sample data notice -->
    <div v-if="hasDemoData" class="flex flex-col gap-3 rounded-3xl bg-accent-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p class="text-sm text-slate-800">You're looking at <strong>sample data</strong>. Clear it when you're ready for your real {{ t.membersLower }}.</p>
      <AppButton size="sm" variant="secondary" :loading="clearingDemo" @click="clearDemoData">Clear sample data</AppButton>
    </div>

    <!-- Setup: no real members yet -->
    <template v-if="realMembers === 0">
      <!-- They already sent their list -->
      <section v-if="openUpload" class="rounded-[32px] border border-slate-200 bg-white p-6 sm:p-8">
        <div class="flex items-start gap-4">
          <span class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700">
            <svg class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
          </span>
          <div>
            <h2 class="text-xl font-extrabold tracking-tight text-slate-800">We've got your list</h2>
            <p class="mt-1 text-slate-600">We're adding your plans, {{ t.membersLower }} and due dates now, usually within a few hours. You don't need to do anything else. This page fills in as soon as it's done.</p>
            <NuxtLink to="/dashboard/upload" class="mt-4 inline-block text-sm font-bold text-primary-700 hover:underline">See what you sent, or send more</NuxtLink>
          </div>
        </div>
      </section>

      <!-- Nothing sent yet: one clear next step -->
      <section v-else class="relative overflow-hidden rounded-[32px] bg-primary-600 p-6 text-white sm:p-10">
        <div class="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full border-[36px] border-white/10" aria-hidden="true" />
        <div class="relative max-w-xl">
          <p class="text-sm font-semibold text-primary-100">One step left</p>
          <h2 class="mt-2 text-3xl font-extrabold leading-tight tracking-tight">Send us your {{ t.memberLower }} list. <span class="serif-accent">We'll do the rest.</span></h2>
          <p class="mt-3 text-primary-100">Photos of your register, an Excel sheet or a pasted list, in any format. We add everyone with their due dates, then show you who to remind, with a one-tap WhatsApp button.</p>
          <div class="mt-6 flex flex-wrap gap-3">
            <NuxtLink to="/dashboard/upload" class="rounded-full bg-white px-6 py-3.5 text-base font-bold text-primary-700 hover:bg-primary-50">Upload your list</NuxtLink>
            <a v-if="registerHelpLink" :href="registerHelpLink" target="_blank" rel="noopener" class="rounded-full border border-white/40 px-6 py-3.5 text-base font-bold text-white hover:bg-white/10">Send on WhatsApp</a>
          </div>
        </div>
      </section>

      <p class="text-sm text-slate-600">
        Prefer to do it yourself?
        <NuxtLink to="/dashboard/members?import=1" class="font-semibold text-primary-700 hover:underline">Paste your list</NuxtLink>
        or
        <NuxtLink to="/dashboard/members/new" class="font-semibold text-primary-700 hover:underline">add {{ t.membersLower }} one by one</NuxtLink>.
      </p>

      <AutoRemindersCard :data="collectionsData" :is-owner="isOwner" @turn-on="turnOnReminders" @pay="payForReminders" />
    </template>

    <!-- Running: the numbers that matter -->
    <template v-if="stats.activeMembers > 0">
      <div class="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <NuxtLink to="/dashboard/payments" class="relative overflow-hidden rounded-[28px] bg-primary-600 p-5 text-white">
          <span class="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full border-[18px] border-white/10" aria-hidden="true" />
          <p class="relative text-sm font-semibold text-primary-100">Collected this month</p>
          <p class="relative mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">{{ formatCurrency(stats.monthRevenue) }}</p>
        </NuxtLink>
        <NuxtLink to="/dashboard/collections" class="rounded-[28px] border border-slate-200 bg-white p-5">
          <p class="flex items-center gap-2 text-sm font-semibold text-slate-600"><span class="h-2 w-2 rounded-full bg-accent-500" aria-hidden="true" />Overdue</p>
          <p class="mt-2 text-2xl font-extrabold tracking-tight text-slate-800 sm:text-3xl">{{ formatCurrency(summary.overdueAmount) }}</p>
          <p class="mt-0.5 text-sm text-slate-600">{{ summary.overdueCount }} {{ summary.overdueCount === 1 ? t.memberLower : t.membersLower }}</p>
        </NuxtLink>
        <NuxtLink to="/dashboard/collections" class="rounded-[28px] bg-accent-100 p-5">
          <p class="text-sm font-semibold text-slate-700">Due soon</p>
          <p class="mt-2 text-2xl font-extrabold tracking-tight text-slate-800 sm:text-3xl">{{ formatCurrency(summary.upcomingAmount) }}</p>
          <p class="mt-0.5 text-sm text-slate-700">{{ summary.upcomingCount }} {{ summary.upcomingCount === 1 ? t.memberLower : t.membersLower }}</p>
        </NuxtLink>
        <NuxtLink to="/dashboard/members" class="rounded-[28px] bg-primary-100 p-5">
          <p class="text-sm font-semibold text-primary-800">Active {{ t.membersLower }}</p>
          <p class="mt-2 text-2xl font-extrabold tracking-tight text-primary-800 sm:text-3xl">{{ stats.activeMembers }}</p>
        </NuxtLink>
      </div>

      <AutoRemindersCard :data="collectionsData" :is-owner="isOwner" show-on @turn-on="turnOnReminders" @pay="payForReminders" />

      <div class="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(18rem,1fr)]">
        <section class="rounded-[28px] border border-slate-200 bg-white p-4 sm:p-5">
          <div class="mb-2 flex items-center justify-between px-1">
            <h2 class="text-lg font-extrabold tracking-tight text-slate-800">Needs a nudge</h2>
            <NuxtLink to="/dashboard/collections" class="text-sm font-bold text-primary-700 hover:underline">See all</NuxtLink>
          </div>
          <div v-if="nudgeList.length === 0" class="px-1 py-6 text-slate-600">
            Everyone is paid up. We'll show people here a few days before they're due.
          </div>
          <ul v-else class="space-y-1">
            <li v-for="(item, i) in nudgeList" :key="item.key" class="flex items-center gap-3 rounded-2xl p-3" :class="i % 2 === 0 ? 'bg-slate-50' : ''">
              <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-extrabold" :class="item.overdue ? 'bg-accent-200 text-accent-700' : 'bg-accent-100 text-slate-700'">{{ initials(item.memberName) }}</span>
              <NuxtLink :to="`/dashboard/members/${item.memberId}`" class="min-w-0 flex-1">
                <p class="truncate font-bold text-slate-800">{{ item.memberName }}</p>
                <p class="truncate text-sm text-slate-600">{{ formatCurrency(item.amount) }} · {{ item.planName }}</p>
                <p class="text-xs font-semibold" :class="item.overdue ? 'text-accent-700' : 'text-slate-600'">{{ dueText(item) }}</p>
              </NuxtLink>
              <AppAction
                v-if="item.memberPhone"
                icon="whatsapp"
                tone="whatsapp"
                class="shrink-0"
                :href="getWhatsAppLink(item.memberPhone, item.message)"
                external
              >Remind</AppAction>
            </li>
          </ul>
        </section>

        <section class="rounded-[28px] border border-slate-200 bg-white p-4 sm:p-5">
          <div class="mb-2 flex items-center justify-between px-1">
            <h2 class="text-lg font-extrabold tracking-tight text-slate-800">Recent payments</h2>
            <NuxtLink to="/dashboard/payments" class="text-sm font-bold text-primary-700 hover:underline">See all</NuxtLink>
          </div>
          <p v-if="recentPayments.length === 0" class="px-1 py-6 text-slate-600">No payments yet this month.</p>
          <ul v-else class="divide-y divide-slate-100">
            <li v-for="p in recentPayments" :key="p.id" class="flex items-center justify-between gap-3 px-1 py-3">
              <div class="min-w-0">
                <p class="truncate font-semibold text-slate-800">{{ p.memberName }}</p>
                <p class="text-sm text-slate-600">{{ formatDate(p.date) }}</p>
              </div>
              <p class="shrink-0 font-extrabold text-slate-800">{{ formatCurrency(p.amount) }}</p>
            </li>
          </ul>
        </section>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { AutoRemindersData } from "~/components/AutoRemindersCard.vue";

definePageMeta({ layout: "dashboard", middleware: "org-required" });

const { formatCurrency } = useFormatCurrency();
const { formatDate } = useFormatDate();
const { orgId, currentOrg } = useOrg();
const t = useTerminology();
const { getWhatsAppLink } = useWhatsApp();

interface DashboardData {
  stats: {
    activeMembers: number;
    expiringSoon: number;
    monthRevenue: number;
    monthExpenses: number;
    monthProfit: number;
    pendingPayments: number;
  };
  recentPayments: Array<{ id: number; amount: number; date: string; memberName: string }>;
}

interface CollectionItem {
  key: string;
  memberId: number;
  memberName: string;
  memberPhone: string | null;
  planName: string;
  amount: number;
  dueDate: string;
  daysLate: number;
  overdue: boolean;
  message: string;
}

interface CollectionsResponse extends AutoRemindersData {
  items: CollectionItem[];
  summary: { overdueCount: number; overdueAmount: number; upcomingCount: number; upcomingAmount: number };
}

// Independent requests: start them together so their latencies don't stack.
const [
  { data: dashData },
  { data: collectionsData },
  { data: demoStatus, refresh: refreshDemoStatus },
  { data: uploads },
] = await Promise.all([
  useFetch<DashboardData>(`/api/orgs/${orgId.value}/dashboard`),
  useFetch<CollectionsResponse>(`/api/orgs/${orgId.value}/collections`),
  useFetch<{ hasDemoData: boolean; realMembers: number; realPlans: number }>(`/api/orgs/${orgId.value}/demo-data`),
  useFetch<Array<{ id: number; status: string }>>(`/api/orgs/${orgId.value}/uploads`, { key: `uploads-${orgId.value}` }),
]);

const stats = computed(() => dashData.value?.stats ?? {
  activeMembers: 0, expiringSoon: 0, pendingPayments: 0, monthRevenue: 0, monthExpenses: 0, monthProfit: 0,
});
const recentPayments = computed(() => (dashData.value?.recentPayments ?? []).slice(0, 5));
const summary = computed(() => collectionsData.value?.summary ?? { overdueCount: 0, overdueAmount: 0, upcomingCount: 0, upcomingAmount: 0 });
const nudgeList = computed(() => {
  const items = [...(collectionsData.value?.items ?? [])];
  items.sort((a, b) => Number(b.overdue) - Number(a.overdue) || b.daysLate - a.daysLate);
  return items.slice(0, 5);
});
const nudgeCount = computed(() => summary.value.overdueCount + summary.value.upcomingCount);

const hasDemoData = computed(() => demoStatus.value?.hasDemoData ?? false);
// Fall back to the plain count if the request failed, so the setup card doesn't flash for active orgs.
const realMembers = computed(() => demoStatus.value?.realMembers ?? stats.value.activeMembers);
const openUpload = computed(() => (uploads.value ?? []).some(u => u.status === "pending" || u.status === "processing"));

const now = new Date();
const todayLabel = now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Kolkata" });
const hour = Number(now.toLocaleString("en-IN", { hour: "numeric", hour12: false, timeZone: "Asia/Kolkata" }));
const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

const headline = computed(() => {
  if (realMembers.value === 0) return openUpload.value ? "Your setup is on its way." : "Let's get you set up.";
  const n = nudgeCount.value;
  if (n === 0) return "Everyone is paid up.";
  return `${n} ${n === 1 ? "person needs" : "people need"} a nudge.`;
});

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]!.toUpperCase()).join("");
}

function dueText(item: CollectionItem) {
  if (item.overdue) return item.daysLate === 1 ? "1 day late" : `${item.daysLate} days late`;
  return `due ${formatDate(item.dueDate)}`;
}

const isOwner = computed(() => currentOrg.value?.role === "owner");
function turnOnReminders() {
  navigateTo("/dashboard/collections?turnOn=1");
}
function payForReminders() {
  navigateTo("/dashboard/collections?pay=1");
}

const { whatsappLink } = useSupport();
const registerHelpLink = computed(() => whatsappLink(
  `Hi MemberBook team, please help me add my ${t.value.membersLower} to ${currentOrg.value?.name ?? "my workspace"}. I'll send photos of my register here.`,
));

const clearingDemo = ref(false);
async function clearDemoData() {
  clearingDemo.value = true;
  try {
    await $fetch(`/api/orgs/${orgId.value}/demo-data`, { method: "DELETE" });
    await refreshDemoStatus();
    refreshNuxtData();
  } catch (e: unknown) {
    const err = e as { data?: { statusMessage?: string } };
    alert(err.data?.statusMessage || "Failed to clear sample data");
  } finally {
    clearingDemo.value = false;
  }
}
</script>
