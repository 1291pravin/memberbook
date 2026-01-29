<template>
  <div class="p-4 space-y-6">
    <h1 class="text-xl font-bold text-gray-900">Dashboard</h1>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <AppStatCard label="Active Members" :value="stats.activeMembers" />
      <AppStatCard label="Expiring Soon" :value="stats.expiringSoon" />
      <AppStatCard label="Pending Payments" :value="stats.pendingPayments" />
      <AppStatCard label="This Month" :value="formatCurrency(stats.monthRevenue)" />
    </div>

    <!-- Quick Actions -->
    <div class="flex gap-2 flex-wrap">
      <NuxtLink to="/dashboard/members/new">
        <AppButton size="sm">Add Member</AppButton>
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
        <div v-for="item in expiring" :key="item.memberId" class="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
          <div>
            <p class="text-sm font-medium text-gray-900">{{ item.memberName }}</p>
            <p class="text-xs text-gray-500">{{ item.planName }} &mdash; expires {{ item.endDate }}</p>
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
            <NuxtLink :to="`/dashboard/members/${item.memberId}`" class="text-indigo-600 text-xs font-medium">View</NuxtLink>
          </div>
        </div>
      </div>
    </AppCard>

    <!-- Recent Payments -->
    <AppCard v-if="recentPayments.length > 0" title="Recent Payments">
      <div class="space-y-2">
        <div v-for="p in recentPayments" :key="p.id" class="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
          <div>
            <p class="text-sm font-medium text-gray-900">{{ p.memberName }}</p>
            <p class="text-xs text-gray-500">{{ p.date }}</p>
          </div>
          <p class="text-sm font-semibold text-gray-900">{{ formatCurrency(p.amount) }}</p>
        </div>
      </div>
    </AppCard>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "dashboard", middleware: "org-required" });

const { formatCurrency } = useFormatCurrency();
const { orgId } = useOrg();
const { getWhatsAppLink, getReminderMessage } = useWhatsApp();

interface DashboardData {
  stats: { activeMembers: number; expiringSoon: number; monthRevenue: number; pendingPayments: number };
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

const stats = reactive({ activeMembers: 0, expiringSoon: 0, pendingPayments: 0, monthRevenue: 0 });
const recentPayments = ref<DashboardData["recentPayments"]>([]);
const expiring = ref<ExpiringItem[]>([]);

const [dashData, expiringData] = await Promise.all([
  $fetch<DashboardData>(`/api/orgs/${orgId.value}/dashboard`),
  $fetch<{ expiring: ExpiringItem[] }>(`/api/orgs/${orgId.value}/members/expiring`),
]);

Object.assign(stats, dashData.stats);
recentPayments.value = dashData.recentPayments;
expiring.value = expiringData.expiring;
</script>
