<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p class="text-sm font-semibold text-primary-600">Admin</p>
        <h1 class="mt-1 text-2xl font-bold text-slate-800">Usage</h1>
        <p class="mt-1 text-sm text-slate-600">
          Signups, activation, and customer activity.
        </p>
      </div>
      <label class="w-full md:w-44">
        <span class="mb-1 block text-sm font-medium text-slate-700">Period</span>
        <select
          v-model="days"
          class="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
        >
          <option :value="7">Last 7 days</option>
          <option :value="28">Last 28 days</option>
          <option :value="90">Last 90 days</option>
          <option :value="365">Last 365 days</option>
        </select>
      </label>
    </div>

    <div
      v-if="error"
      class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
    >
      Could not load admin usage.
    </div>

    <div v-if="pending" class="grid gap-4 md:grid-cols-4">
      <div v-for="i in 4" :key="i" class="h-24 animate-pulse rounded-lg bg-white" />
    </div>

    <template v-else-if="data">
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AppCard title="New signups">
          <p class="text-3xl font-bold text-slate-800">{{ formatNumber(data.periodTotals.real_orgs_new) }}</p>
          <p class="mt-1 text-sm text-slate-600">
            {{ formatNumber(data.periodTotals.users_new) }} new users
          </p>
        </AppCard>
        <AppCard title="Active organizations">
          <p class="text-3xl font-bold text-slate-800">{{ formatNumber(data.activeOrganizations.length) }}</p>
          <p class="mt-1 text-sm text-slate-600">
            {{ formatNumber(data.totals.real_orgs_total) }} real organizations total
          </p>
        </AppCard>
        <AppCard title="Members added">
          <p class="text-3xl font-bold text-slate-800">{{ formatNumber(data.periodTotals.members_added) }}</p>
          <p class="mt-1 text-sm text-slate-600">
            {{ formatNumber(data.periodTotals.plans_created) }} plans created
          </p>
        </AppCard>
        <AppCard title="Payments">
          <p class="text-3xl font-bold text-slate-800">{{ formatCurrency(data.periodTotals.payment_volume) }}</p>
          <p class="mt-1 text-sm text-slate-600">
            {{ formatNumber(data.periodTotals.payments_recorded) }} payments recorded
          </p>
        </AppCard>
      </div>

      <div class="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
        <AppCard title="Daily activity">
          <div class="overflow-x-auto">
            <table class="min-w-full text-left text-sm">
              <thead class="text-xs uppercase text-slate-500">
                <tr>
                  <th class="whitespace-nowrap px-2 py-2 font-semibold">Date</th>
                  <th class="whitespace-nowrap px-2 py-2 font-semibold">Orgs</th>
                  <th class="whitespace-nowrap px-2 py-2 font-semibold">Users</th>
                  <th class="whitespace-nowrap px-2 py-2 font-semibold">Members</th>
                  <th class="whitespace-nowrap px-2 py-2 font-semibold">Payments</th>
                  <th class="whitespace-nowrap px-2 py-2 font-semibold">Check-ins</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-slate-700">
                <tr v-for="row in data.daily.slice().reverse().slice(0, 14)" :key="row.date">
                  <td class="whitespace-nowrap px-2 py-2">{{ row.date }}</td>
                  <td class="px-2 py-2">{{ formatNumber(row.organizations) }}</td>
                  <td class="px-2 py-2">{{ formatNumber(row.users) }}</td>
                  <td class="px-2 py-2">{{ formatNumber(row.members) }}</td>
                  <td class="px-2 py-2">{{ formatNumber(row.payments) }}</td>
                  <td class="px-2 py-2">{{ formatNumber(row.checkIns) }}</td>
                </tr>
                <tr v-if="data.daily.length === 0">
                  <td class="px-2 py-4 text-slate-600" colspan="6">No activity in this period.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </AppCard>

        <AppCard title="Recent signups">
          <div class="overflow-x-auto">
            <table class="min-w-full text-left text-sm">
              <thead class="text-xs uppercase text-slate-500">
                <tr>
                  <th class="whitespace-nowrap px-2 py-2 font-semibold">Organization</th>
                  <th class="whitespace-nowrap px-2 py-2 font-semibold">Owner</th>
                  <th class="whitespace-nowrap px-2 py-2 font-semibold">Usage</th>
                  <th class="whitespace-nowrap px-2 py-2 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-slate-700">
                <tr v-for="org in data.recentSignups" :key="`signup-${org.id}-${org.owner_id}`">
                  <td class="px-2 py-3">
                    <p class="font-semibold text-slate-800">{{ org.name }}</p>
                    <p class="text-xs text-slate-600">{{ org.type }}, {{ formatDate(org.created_at) }}</p>
                  </td>
                  <td class="px-2 py-3">
                    <p class="font-medium text-slate-800">{{ org.owner_name || "No owner" }}</p>
                    <p class="text-xs text-slate-600">{{ org.owner_email || "No email" }}</p>
                  </td>
                  <td class="whitespace-nowrap px-2 py-3 text-xs text-slate-600">
                    {{ formatNumber(org.members) }} members, {{ formatNumber(org.payments) }} payments
                  </td>
                  <td class="px-2 py-3">
                    <AppButton
                      v-if="org.owner_email"
                      size="sm"
                      variant="secondary"
                      :loading="loginOrgId === org.id"
                      @click="loginAsOwner(org)"
                    >
                      Login
                    </AppButton>
                  </td>
                </tr>
                <tr v-if="data.recentSignups.length === 0">
                  <td class="px-2 py-4 text-slate-600" colspan="4">No new signups in this period.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </AppCard>
      </div>

      <AppCard title="Most active organizations">
        <div class="overflow-x-auto">
          <table class="min-w-full text-left text-sm">
            <thead class="text-xs uppercase text-slate-500">
              <tr>
                <th class="whitespace-nowrap px-2 py-2 font-semibold">Organization</th>
                <th class="whitespace-nowrap px-2 py-2 font-semibold">Owner</th>
                <th class="whitespace-nowrap px-2 py-2 font-semibold">Members</th>
                <th class="whitespace-nowrap px-2 py-2 font-semibold">Plans</th>
                <th class="whitespace-nowrap px-2 py-2 font-semibold">Payments</th>
                <th class="whitespace-nowrap px-2 py-2 font-semibold">Check-ins</th>
                <th class="whitespace-nowrap px-2 py-2 font-semibold">Last active</th>
                <th class="whitespace-nowrap px-2 py-2 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-700">
              <tr v-for="org in data.activeOrganizations" :key="`active-${org.id}-${org.owner_id}`">
                <td class="px-2 py-3">
                  <p class="font-semibold text-slate-800">{{ org.name }}</p>
                  <p class="text-xs text-slate-600">{{ org.type }}</p>
                </td>
                <td class="px-2 py-3">
                  <p class="font-medium text-slate-800">{{ org.owner_name || "No owner" }}</p>
                  <p class="text-xs text-slate-600">{{ org.owner_email || "No email" }}</p>
                </td>
                <td class="px-2 py-3">{{ formatNumber(org.members) }}</td>
                <td class="px-2 py-3">{{ formatNumber(org.plans) }}</td>
                <td class="px-2 py-3">{{ formatNumber(org.payments) }}</td>
                <td class="px-2 py-3">{{ formatNumber(org.checkins) }}</td>
                <td class="whitespace-nowrap px-2 py-3">{{ formatDate(org.last_activity_at) }}</td>
                <td class="px-2 py-3">
                  <AppButton
                    v-if="org.owner_email"
                    size="sm"
                    variant="secondary"
                    :loading="loginOrgId === org.id"
                    @click="loginAsOwner(org)"
                  >
                    Login
                  </AppButton>
                </td>
              </tr>
              <tr v-if="data.activeOrganizations.length === 0">
                <td class="px-2 py-4 text-slate-600" colspan="8">No active organizations yet.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </AppCard>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "admin", middleware: "admin" });

type AdminOrg = {
  id: number;
  name: string;
  type: string;
  created_at: string;
  owner_id: number | null;
  owner_name: string | null;
  owner_email: string | null;
  members: number;
  plans: number;
  payments: number;
  checkins: number;
  last_activity_at: string;
};

type AdminUsage = {
  totals: Record<string, number>;
  periodTotals: Record<string, number>;
  daily: Array<Record<string, number | string> & { date: string }>;
  recentSignups: AdminOrg[];
  activeOrganizations: AdminOrg[];
};

const days = ref(28);
const loginOrgId = ref<number | null>(null);

const { data, pending, error } = await useAsyncData<AdminUsage>(
  "admin-usage",
  () => $fetch("/api/admin/usage", { query: { days: days.value } }),
  { watch: [days] },
);

const numberFormatter = new Intl.NumberFormat("en-IN");
const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function formatNumber(value: unknown) {
  return numberFormatter.format(Number(value ?? 0));
}

function formatCurrency(value: unknown) {
  return currencyFormatter.format(Number(value ?? 0) / 100);
}

function formatDate(value: string | null | undefined) {
  if (!value) return "No activity";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No activity";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

async function loginAsOwner(org: AdminOrg) {
  if (!org.owner_email) return;
  loginOrgId.value = org.id;
  try {
    const result = await $fetch<{ redirectTo: string }>("/api/admin/autologin", {
      method: "POST",
      body: { email: org.owner_email, orgId: org.id },
    });
    await navigateTo(result.redirectTo || "/dashboard");
  } finally {
    loginOrgId.value = null;
  }
}
</script>
