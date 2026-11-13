<template>
  <div class="p-4 space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <NuxtLink to="/dashboard/payments" class="text-sm text-primary-600 hover:text-primary-500">&larr; Payments</NuxtLink>
        <h1 class="text-xl font-bold text-slate-800 mt-1">Pending payments</h1>
      </div>
    </div>

    <div v-if="pending.length === 0">
      <AppEmptyState title="No pending payments" description="All subscriptions are fully paid." />
    </div>

    <div v-else class="space-y-2">
      <AppCard v-for="item in pending" :key="item.subscription_id" class="!p-4 sm:!p-5">
        <div class="flex items-baseline justify-between gap-3">
          <NuxtLink :to="`/dashboard/members/${item.member_id}`" class="min-w-0 truncate font-medium text-slate-800 hover:text-primary-700">{{ item.member_name }}</NuxtLink>
          <p class="shrink-0 font-semibold text-slate-800">{{ formatCurrency(item.pending_amount) }}</p>
        </div>
        <p class="mt-0.5 text-xs text-slate-600">
          {{ item.plan_name }} &middot; <span class="whitespace-nowrap">{{ formatDate(item.start_date) }}</span> &ndash; <span class="whitespace-nowrap">{{ formatDate(item.end_date) }}</span>
        </p>
        <div class="-ml-2.5 mt-2 flex flex-wrap items-center gap-1 border-t border-slate-100 pt-2">
          <AppAction
            v-if="item.member_phone"
            icon="whatsapp"
            tone="whatsapp"
            :href="getWhatsAppLink(item.member_phone, getPaymentReminderMessage(item.member_name, formatCurrency(item.pending_amount)))"
            external
          >
            Remind
          </AppAction>
          <AppAction icon="eye" :to="`/dashboard/members/${item.member_id}`">View member</AppAction>
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
const { getWhatsAppLink, getPaymentReminderMessage } = useWhatsApp();

interface PendingItem {
  subscription_id: number;
  member_id: number;
  member_name: string;
  member_phone: string | null;
  plan_name: string;
  subscription_amount: number;
  start_date: string;
  end_date: string;
  paid_amount: number;
  pending_amount: number;
}

const { data: pendingData } = await useFetch<{ pending: PendingItem[] }>(
  `/api/orgs/${orgId.value}/payments/pending`,
);
const pending = computed(() => pendingData.value?.pending ?? []);
</script>
