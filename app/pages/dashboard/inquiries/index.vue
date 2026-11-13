<template>
  <div class="p-4 space-y-4">
    <div class="flex items-center justify-between gap-3">
      <h1 class="text-xl font-bold text-slate-800">Inquiries</h1>
      <NuxtLink to="/dashboard/inquiries/new">
        <AppButton size="sm" class="whitespace-nowrap">+ Add inquiry</AppButton>
      </NuxtLink>
    </div>

    <div class="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
      <button
        v-for="s in statuses"
        :key="s.value"
        class="whitespace-nowrap rounded-full px-3 py-1 text-sm font-medium transition-colors"
        :class="statusFilter === s.value ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
        @click="statusFilter = s.value"
      >
        {{ s.label }}
      </button>
    </div>

    <div v-if="inquiries.length === 0">
      <AppEmptyState title="No inquiries" description="Track walk-in leads and follow-ups here.">
        <template #action>
          <NuxtLink to="/dashboard/inquiries/new">
            <AppButton>Add Inquiry</AppButton>
          </NuxtLink>
        </template>
      </AppEmptyState>
    </div>

    <div v-else class="space-y-2">
      <AppCard v-for="inq in inquiries" :key="inq.id" class="!p-4">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="font-medium text-slate-800 truncate">{{ inq.name }}</p>
            <a v-if="inq.phone" :href="`tel:${inq.phone}`" class="text-sm text-primary-700">{{ inq.phone }}</a>
            <p v-if="inq.interest" class="text-xs text-slate-600 mt-1">{{ inq.interest }}</p>
            <p v-if="inq.followUpDate" class="text-xs text-slate-600">Follow up {{ formatDate(inq.followUpDate) }}</p>
          </div>
          <label class="relative shrink-0">
            <span class="sr-only">Status for {{ inq.name }}</span>
            <select
              class="appearance-none rounded-full border-0 py-1 pl-3 pr-7 text-xs font-semibold capitalize focus:ring-2 focus:ring-primary-500"
              :class="statusPillClass(inq.status)"
              @change="updateStatus(inq.id, ($event.target as HTMLSelectElement).value)"
            >
              <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value" :selected="opt.value === inq.status">{{ opt.label }}</option>
            </select>
            <svg class="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" /></svg>
          </label>
        </div>
      </AppCard>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "dashboard", middleware: "org-required" });

const { orgId } = useOrg();

interface Inquiry {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  interest: string | null;
  followUpDate: string | null;
  status: string;
}

const statuses = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "converted", label: "Converted" },
  { value: "lost", label: "Lost" },
];

const statusFilter = ref("all");

const query = computed(() => {
  const params: Record<string, string> = {};
  if (statusFilter.value !== "all") params.status = statusFilter.value;
  return params;
});

const { data: inquiriesData, refresh: refreshInquiries } = await useFetch<{ inquiries: Inquiry[] }>(
  `/api/orgs/${orgId.value}/inquiries`,
  { query },
);
const inquiries = computed(() => inquiriesData.value?.inquiries ?? []);

const { formatDate } = useFormatDate();
const statusOptions = statuses.filter(st => st.value !== "all");

function statusPillClass(status: string) {
  const map: Record<string, string> = {
    new: "bg-info-100 text-info-700",
    contacted: "bg-warning-100 text-warning-700",
    converted: "bg-success-100 text-success-700",
    lost: "bg-slate-100 text-slate-700",
  };
  return map[status] || "bg-slate-100 text-slate-700";
}

async function updateStatus(id: number, status: string) {
  await $fetch(`/api/orgs/${orgId.value}/inquiries/${id}`, {
    method: "PUT",
    body: { status },
  });
  await refreshInquiries();
}
</script>
