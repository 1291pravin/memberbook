<template>
  <div class="p-4 space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold text-slate-800">Dashboard</h1>
      <NuxtLink to="/dashboard/analytics" class="text-sm text-primary-600 hover:text-primary-700 font-medium">
        View detailed analytics →
      </NuxtLink>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <AppStatCard :label="`Active ${t.members}`" :value="stats.activeMembers" />
      <AppStatCard label="Expiring Soon" :value="stats.expiringSoon" />
      <AppStatCard label="Pending Payments" :value="stats.pendingPayments" />
      <AppStatCard label="This Month Revenue" :value="formatCurrency(stats.monthRevenue)" />
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
            <p class="text-xs text-slate-500">{{ item.planName }} &mdash; expires {{ formatDate(item.endDate) }}</p>
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
            <p class="text-xs text-slate-500">{{ formatDate(p.date) }}</p>
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
