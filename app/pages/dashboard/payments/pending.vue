<template>
  <div class="p-4 space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <NuxtLink to="/dashboard/payments" class="text-sm text-primary-600 hover:text-primary-500">&larr; All Payments</NuxtLink>
        <h1 class="text-xl font-bold text-slate-800 mt-1">Pending Payments</h1>
      </div>
    </div>

    <div v-if="pending.length === 0">
      <AppEmptyState title="No pending payments" description="All subscriptions are fully paid." />
    </div>

    <div v-else class="space-y-2">
      <AppCard v-for="item in pending" :key="item.subscription_id">
        <div class="flex items-center justify-between">
          <div>
            <p class="font-medium text-slate-800 text-sm">{{ item.member_name }}</p>
            <p class="text-xs text-slate-600">{{ item.plan_name }} &middot; Due: {{ formatCurrency(item.pending_amount) }}</p>
            <p class="text-xs text-slate-600">{{ formatDate(item.start_date) }} &mdash; {{ formatDate(item.end_date) }}</p>
          </div>
          <div class="flex items-center gap-2">
            <a
              v-if="item.member_phone"
              :href="getWhatsAppLink(item.member_phone, getPaymentReminderMessage(item.member_name, formatCurrency(item.pending_amount)))"
              target="_blank"
              class="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
              </svg>
              WhatsApp
            </a>
            <NuxtLink :to="`/dashboard/members/${item.member_id}`">
              <AppButton size="sm" variant="ghost">View</AppButton>
            </NuxtLink>
          </div>
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
