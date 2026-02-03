<template>
  <div class="p-4 space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold text-gray-900">Inquiries</h1>
      <NuxtLink to="/dashboard/inquiries/new">
        <AppButton>Add Inquiry</AppButton>
      </NuxtLink>
    </div>

    <div class="flex gap-2 overflow-x-auto pb-1">
      <button
        v-for="s in statuses"
        :key="s.value"
        class="whitespace-nowrap rounded-full px-3 py-1 text-sm font-medium transition-colors"
        :class="statusFilter === s.value ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
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
      <AppCard v-for="inq in inquiries" :key="inq.id">
        <div class="flex items-start justify-between">
          <div>
            <p class="font-medium text-gray-900 text-sm">{{ inq.name }}</p>
            <p v-if="inq.phone" class="text-xs text-gray-500">{{ inq.phone }}</p>
            <p v-if="inq.interest" class="text-xs text-gray-400 mt-1">{{ inq.interest }}</p>
            <p v-if="inq.followUpDate" class="text-xs text-gray-400">Follow up: {{ inq.followUpDate }}</p>
          </div>
          <div class="flex items-center gap-2">
            <AppBadge :color="statusColor(inq.status)">{{ inq.status }}</AppBadge>
            <select
              :value="inq.status"
              class="text-xs border border-gray-200 rounded px-1 py-0.5"
              @change="updateStatus(inq.id, ($event.target as HTMLSelectElement).value)"
            >
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="converted">Converted</option>
              <option value="lost">Lost</option>
            </select>
          </div>
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
  () => `/api/orgs/${orgId.value}/inquiries`,
  { query },
);
const inquiries = computed(() => inquiriesData.value?.inquiries ?? []);

function statusColor(status: string) {
  const map: Record<string, "green" | "yellow" | "blue" | "gray" | "red"> = {
    new: "blue",
    contacted: "yellow",
    converted: "green",
    lost: "gray",
  };
  return map[status] || "gray";
}

async function updateStatus(id: number, status: string) {
  await $fetch(`/api/orgs/${orgId.value}/inquiries/${id}`, {
    method: "PUT",
    body: { status },
  });
  await refreshInquiries();
}
</script>
