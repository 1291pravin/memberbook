<template>
  <div class="p-4 space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold text-gray-900">Members</h1>
      <NuxtLink to="/dashboard/members/new">
        <AppButton>Add Member</AppButton>
      </NuxtLink>
    </div>

    <div class="flex gap-2 items-center">
      <AppSearchBar v-model="search" placeholder="Search by name or phone..." class="flex-1" />
      <select
        v-model="statusFilter"
        class="rounded-lg border border-gray-300 px-3 py-2 text-sm"
      >
        <option value="all">All</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
    </div>

    <div v-if="filteredMembers.length === 0 && !loading">
      <AppEmptyState
        :title="search ? 'No members found' : 'No members yet'"
        :description="search ? 'Try a different search term.' : 'Add your first member to get started.'"
      >
        <template v-if="!search" #action>
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
        <AppCard class="hover:border-indigo-200 transition-colors">
          <div class="flex items-center justify-between">
            <div>
              <p class="font-medium text-gray-900">{{ member.name }}</p>
              <p v-if="member.phone" class="text-sm text-gray-500">{{ member.phone }}</p>
            </div>
            <AppBadge :color="member.status === 'active' ? 'green' : 'gray'">
              {{ member.status }}
            </AppBadge>
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
}

const members = ref<Member[]>([]);
const loading = ref(true);
const search = ref("");
const statusFilter = ref("all");

const filteredMembers = computed(() => members.value);

async function loadMembers() {
  loading.value = true;
  const params = new URLSearchParams();
  if (search.value) params.set("search", search.value);
  if (statusFilter.value !== "all") params.set("status", statusFilter.value);
  const data = await $fetch<{ members: Member[] }>(`/api/orgs/${orgId.value}/members?${params}`);
  members.value = data.members;
  loading.value = false;
}

watch([search, statusFilter], () => loadMembers(), { debounce: 300 } as never);

await loadMembers();
</script>
