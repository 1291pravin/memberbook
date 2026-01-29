<template>
  <div class="p-4 max-w-lg">
    <h1 class="text-xl font-bold text-gray-900 mb-6">Add Member</h1>

    <div v-if="error" class="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
      {{ error }}
    </div>

    <form class="space-y-4" @submit.prevent="handleSubmit">
      <AppInput v-model="form.name" label="Name" placeholder="Member name" required />
      <AppInput v-model="form.phone" label="Phone" type="tel" placeholder="+91 98765 43210" />
      <AppInput v-model="form.email" label="Email" type="email" placeholder="member@example.com" />
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea
          v-model="form.notes"
          rows="3"
          class="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          placeholder="Optional notes"
        />
      </div>
      <div class="flex gap-2">
        <AppButton type="submit" :loading="saving">Add Member</AppButton>
        <AppButton variant="secondary" @click="$router.back()">Cancel</AppButton>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "dashboard", middleware: "org-required" });

const { orgId } = useOrg();
const router = useRouter();

const form = reactive({ name: "", phone: "", email: "", notes: "" });
const error = ref("");
const saving = ref(false);

async function handleSubmit() {
  error.value = "";
  saving.value = true;
  try {
    const data = await $fetch<{ member: { id: number } }>(`/api/orgs/${orgId.value}/members`, {
      method: "POST",
      body: form,
    });
    router.push(`/dashboard/members/${data.member.id}`);
  } catch (e: unknown) {
    const err = e as { data?: { statusMessage?: string } };
    error.value = err.data?.statusMessage || "Failed to add member";
  } finally {
    saving.value = false;
  }
}
</script>
