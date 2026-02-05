<template>
  <div class="p-4 space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold text-slate-800">Payments</h1>
      <NuxtLink to="/dashboard/payments/pending">
        <AppButton variant="secondary">Pending</AppButton>
      </NuxtLink>
    </div>

    <div v-if="payments.length === 0">
      <AppEmptyState title="No payments recorded" description="Payments will appear here when you record them from a member's page." />
    </div>

    <div v-else class="space-y-2">
      <AppCard v-for="p in payments" :key="p.id">
        <div class="flex items-center justify-between">
          <div>
            <p class="font-medium text-slate-800 text-sm">{{ p.memberName }}</p>
            <p class="text-xs text-slate-500">{{ formatDate(p.date) }} &middot; {{ p.method }}</p>
            <p v-if="p.notes" class="text-xs text-slate-400 mt-1">{{ p.notes }}</p>
          </div>
          <p class="font-semibold text-slate-800">{{ formatCurrency(p.amount) }}</p>
        </div>
      </AppCard>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "dashboard", middleware: "org-required" });

const { orgId } = useOrg();
const { formatCurrency } = useFormatCurrency();
const { formatDate } = useFormatDate();

interface PaymentRow {
  id: number;
  amount: number;
  date: string;
  method: string;
  notes: string | null;
  memberName: string;
}

const { data: paymentsData } = await useFetch<{ payments: PaymentRow[] }>(
  `/api/orgs/${orgId.value}/payments`,
);
const payments = computed(() => paymentsData.value?.payments ?? []);
</script>
