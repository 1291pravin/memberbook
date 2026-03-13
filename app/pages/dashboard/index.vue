<template>
  <div class="p-4 space-y-6">
    <OnboardingProgressWidget />

    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold text-slate-800">Dashboard</h1>
      <NuxtLink to="/dashboard/analytics" class="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors">
        View detailed analytics &rarr;
      </NuxtLink>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <AppStatCard :label="`Active ${t.members}`" :value="stats.activeMembers" icon-color="primary">
        <template #icon>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
          </svg>
        </template>
      </AppStatCard>
      <AppStatCard label="Expiring Soon" :value="stats.expiringSoon" icon-color="warning">
        <template #icon>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </template>
      </AppStatCard>
      <AppStatCard label="Pending Payments" :value="stats.pendingPayments" icon-color="danger">
        <template #icon>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </template>
      </AppStatCard>
      <AppStatCard label="This Month Revenue" :value="formatCurrency(stats.monthRevenue)" icon-color="success">
        <template #icon>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
          </svg>
        </template>
      </AppStatCard>
    </div>

    <!-- Quick Actions -->
    <div class="flex gap-2 flex-wrap">
      <NuxtLink to="/dashboard/members/new">
        <AppButton size="sm">{{ t.addMember }}</AppButton>
      </NuxtLink>
      <NuxtLink to="/dashboard/inquiries/new">
        <AppButton size="sm" variant="secondary">New Inquiry</AppButton>
      </NuxtLink>
      <NuxtLink to="/dashboard/payments/pending">
        <AppButton size="sm" variant="secondary">Pending Payments</AppButton>
      </NuxtLink>
    </div>

    <!-- Expiring Soon -->
    <AppCard v-if="expiring.length > 0" title="Expiring This Week">
      <div class="space-y-2">
        <div v-for="item in expiring" :key="item.memberId" class="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
          <div>
            <p class="text-sm font-medium text-slate-800">{{ item.memberName }}</p>
            <p class="text-xs text-slate-600">{{ item.planName }} &mdash; expires {{ formatDate(item.endDate) }}</p>
          </div>
          <div class="flex items-center gap-2">
            <a
              v-if="item.memberPhone"
              :href="getWhatsAppLink(item.memberPhone, getReminderMessage(item.memberName, item.planName, item.endDate))"
              target="_blank"
              class="text-green-600 hover:text-green-700 text-xs font-medium"
            >
              Remind
            </a>
            <NuxtLink :to="`/dashboard/members/${item.memberId}`" class="text-primary-600 text-xs font-medium">View</NuxtLink>
          </div>
        </div>
      </div>
    </AppCard>

    <!-- Recent Payments -->
    <AppCard v-if="recentPayments.length > 0" title="Recent Payments">
      <div class="space-y-2">
        <div v-for="p in recentPayments" :key="p.id" class="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
          <div>
            <p class="text-sm font-medium text-slate-800">{{ p.memberName }}</p>
            <p class="text-xs text-slate-600">{{ formatDate(p.date) }}</p>
          </div>
          <p class="text-sm font-semibold text-slate-800">{{ formatCurrency(p.amount) }}</p>
        </div>
      </div>
    </AppCard>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "dashboard", middleware: "org-required" });

const { formatCurrency } = useFormatCurrency();
const { formatDate } = useFormatDate();
const { orgId } = useOrg();
const t = useTerminology();
const { getWhatsAppLink, getReminderMessage } = useWhatsApp();

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

interface ExpiringItem {
  memberId: number;
  memberName: string;
  memberPhone: string | null;
  planName: string;
  endDate: string;
  amount: number;
}

// Fetch dashboard data
const { data: dashData } = await useFetch<DashboardData>(
  `/api/orgs/${orgId.value}/dashboard`,
);
const { data: expiringData } = await useFetch<{ expiring: ExpiringItem[] }>(
  `/api/orgs/${orgId.value}/members/expiring`,
);

const stats = computed(
  () =>
    dashData.value?.stats ?? {
      activeMembers: 0,
      expiringSoon: 0,
      pendingPayments: 0,
      monthRevenue: 0,
      monthExpenses: 0,
      monthProfit: 0,
    }
);
const recentPayments = computed(() => dashData.value?.recentPayments ?? []);
const expiring = computed(() => expiringData.value?.expiring ?? []);
</script>
