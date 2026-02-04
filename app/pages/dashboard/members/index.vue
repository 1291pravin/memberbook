<template>
  <div class="p-4 space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold text-slate-800">Members</h1>
      <NuxtLink to="/dashboard/members/new">
        <AppButton>Add Member</AppButton>
      </NuxtLink>
    </div>

    <div class="flex flex-wrap gap-2 items-center">
      <AppSearchBar v-model="search" placeholder="Search by name or phone..." class="flex-1 min-w-[180px]" />
      <select
        v-model="statusFilter"
        class="rounded-lg border border-slate-300 px-3 py-2 text-sm"
      >
        <option value="all">All Status</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
      <select
        v-model="subscriptionFilter"
        class="rounded-lg border border-slate-300 px-3 py-2 text-sm"
      >
        <option value="all">All Subscriptions</option>
        <option value="expiring">Expiring Soon</option>
        <option value="expired">Expired</option>
        <option value="no-subscription">No Subscription</option>
      </select>
      <select
        v-model="paymentFilter"
        class="rounded-lg border border-slate-300 px-3 py-2 text-sm"
      >
        <option value="all">All Payments</option>
        <option value="unpaid-or-partial">Unpaid / Partial</option>
        <option value="unpaid">Unpaid</option>
        <option value="partial">Partially Paid</option>
      </select>
    </div>

    <div v-if="filteredMembers.length === 0 && !loading">
      <AppEmptyState
        :title="hasFilters ? 'No members found' : 'No members yet'"
        :description="hasFilters ? 'Try adjusting your filters.' : 'Add your first member to get started.'"
      >
        <template v-if="!hasFilters" #action>
          <NuxtLink to="/dashboard/members/new">
            <AppButton>Add Member</AppButton>
          </NuxtLink>
        </template>
      </AppEmptyState>
    </div>

    <div v-else class="space-y-2">
      <NuxtLink
        v-for="member in filteredMembers"
        :key="member.id"
        :to="`/dashboard/members/${member.id}`"
        class="block"
      >
        <AppCard class="hover:border-primary-200 transition-colors">
          <div class="flex items-center justify-between">
            <div class="min-w-0 flex-1">
              <p class="font-medium text-slate-800">{{ member.name }}</p>
              <p v-if="member.phone" class="text-sm text-slate-500">{{ member.phone }}</p>
              <p v-if="member.planName" class="text-sm text-slate-500 mt-0.5">
                {{ member.planName }}
                <span v-if="member.subscriptionEndDate" class="text-slate-400">
                  &middot; ends {{ formatDate(member.subscriptionEndDate) }}
                </span>
              </p>
            </div>
            <div class="flex flex-col items-end gap-1 ml-2 shrink-0">
              <AppBadge :color="member.status === 'active' ? 'green' : 'gray'">
                {{ member.status }}
              </AppBadge>
              <AppBadge v-if="member.subscriptionEndDate" :color="subscriptionBadgeColor(member)">
                {{ subscriptionLabel(member) }}
              </AppBadge>
              <AppBadge v-if="member.paymentStatus && member.paymentStatus !== 'paid'" :color="member.paymentStatus === 'unpaid' ? 'red' : 'yellow'">
                {{ member.paymentStatus === 'unpaid' ? 'unpaid' : 'partial' }}
              </AppBadge>
            </div>
          </div>
        </AppCard>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "dashboard", middleware: "org-required" });

const { orgId } = useOrg();

interface Member {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  status: string;
  subscriptionEndDate: string | null;
  subscriptionStatus: string | null;
  paymentStatus: string | null;
  planName: string | null;
}

const search = ref("");
const statusFilter = ref("all");
const subscriptionFilter = ref("all");
const paymentFilter = ref("all");

const hasFilters = computed(() => search.value || statusFilter.value !== "all" || subscriptionFilter.value !== "all" || paymentFilter.value !== "all");

const query = computed(() => {
  const params: Record<string, string> = {};
  if (search.value) params.search = search.value;
  if (statusFilter.value !== "all") params.status = statusFilter.value;
  if (subscriptionFilter.value !== "all") params.subscription = subscriptionFilter.value;
  if (paymentFilter.value !== "all") params.payment = paymentFilter.value;
  return params;
});

const { data: membersData, status: membersStatus } = await useFetch<{ members: Member[] }>(
  () => `/api/orgs/${orgId.value}/members`,
  { query },
);
const filteredMembers = computed(() => membersData.value?.members ?? []);
const loading = computed(() => membersStatus.value === "pending");

const { formatDate } = useFormatDate();

function isExpired(member: Member): boolean {
  if (!member.subscriptionEndDate) return false;
  return member.subscriptionEndDate < new Date().toISOString().split("T")[0];
}

function isExpiringSoon(member: Member): boolean {
  if (!member.subscriptionEndDate) return false;
  const today = new Date().toISOString().split("T")[0];
  const weekLater = new Date();
  weekLater.setDate(weekLater.getDate() + 7);
  const weekStr = weekLater.toISOString().split("T")[0];
  return member.subscriptionEndDate >= today && member.subscriptionEndDate <= weekStr;
}

function subscriptionBadgeColor(member: Member): "green" | "red" | "yellow" | "gray" {
  if (isExpired(member)) return "red";
  if (isExpiringSoon(member)) return "yellow";
  return "green";
}

function subscriptionLabel(member: Member): string {
  if (isExpired(member)) return "expired";
  if (isExpiringSoon(member)) return "expiring soon";
  return "active";
}
</script>
