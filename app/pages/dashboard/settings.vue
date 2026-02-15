<template>
  <div class="p-4 space-y-6 max-w-2xl">
    <h1 class="text-xl font-bold text-slate-800">Settings</h1>

    <!-- Org Info -->
    <AppCard title="Organization">
      <form class="space-y-4" @submit.prevent="saveOrg">
        <AppInput v-model="orgForm.name" label="Business Name" required />
        <AppSelect
          v-model="orgForm.type"
          label="Business Type"
          :options="businessTypes"
        />
        <AppButton type="submit" size="sm" :loading="savingOrg">Save</AppButton>
      </form>
    </AppCard>

    <!-- Staff Management -->
    <AppCard title="Staff Members">
      <!-- Invite via WhatsApp (owner only) -->
      <div v-if="isOwner" class="mb-6 pb-6 border-b border-slate-100">
        <div class="flex items-center justify-between mb-2">
          <h4 class="text-sm font-medium text-slate-700">Invite Staff via WhatsApp</h4>
        </div>
        <AppButton size="sm" @click="showInviteModal = true">
          Manage Invitations
        </AppButton>
      </div>

      <div class="space-y-3">
        <div v-for="s in staff" :key="s.id" class="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
          <div>
            <p class="text-sm font-medium text-slate-800">{{ s.name }}</p>
            <p class="text-xs text-slate-600">{{ s.email }}</p>
          </div>
          <div class="flex items-center gap-2">
            <AppBadge :color="s.role === 'owner' ? 'blue' : 'gray'">{{ s.role }}</AppBadge>
            <AppButton
              v-if="s.role !== 'owner' && isOwner"
              size="sm"
              variant="danger"
              @click="removeStaff(s.id)"
            >
              Remove
            </AppButton>
          </div>
        </div>
        <div v-if="staff.length === 0" class="text-sm text-slate-600">No staff added yet.</div>
      </div>
    </AppCard>

    <!-- Subscription Settings (owner only) -->
    <AppCard v-if="isOwner" title="Subscription Settings">
      <form class="space-y-4" @submit.prevent="saveSubscriptionSettings">
        <AppInput
          v-model="subscriptionForm.gracePeriodDays"
          label="Grace Period (days)"
          type="number"
          min="0"
          placeholder="0"
        />
        <p class="text-xs text-slate-600 -mt-2">Allow members to continue using services for this many days after subscription expires. Set to 0 to disable.</p>
        <AppButton type="submit" size="sm" :loading="savingSubscriptionSettings">Save</AppButton>
      </form>
    </AppCard>

    <!-- Expense Categories (owner only) -->
    <AppCard v-if="isOwner" title="Expense Categories">
      <p class="text-sm text-slate-600 mb-3">
        Manage expense categories for tracking business expenses.
      </p>
      <div class="space-y-3 mb-4">
        <div v-for="cat in categories" :key="cat.id" class="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
          <div class="flex items-center gap-2">
            <AppBadge :color="cat.color">{{ cat.name }}</AppBadge>
            <span v-if="cat.isSystem" class="text-xs text-slate-600">(default)</span>
          </div>
          <div class="flex items-center gap-2">
            <AppButton
              v-if="!cat.isSystem"
              size="sm"
              variant="secondary"
              @click="editCategory(cat)"
            >
              Edit
            </AppButton>
            <AppButton
              v-if="!cat.isSystem"
              size="sm"
              variant="danger"
              @click="toggleCategoryStatus(cat)"
            >
              {{ cat.isActive ? 'Deactivate' : 'Activate' }}
            </AppButton>
          </div>
        </div>
        <div v-if="categories.length === 0" class="text-sm text-slate-600">No categories yet.</div>
      </div>
      <AppButton size="sm" @click="showAddCategoryModal = true">
        Add Category
      </AppButton>
    </AppCard>

    <!-- Cache Management (owner only) -->
    <AppCard v-if="isOwner" title="Cache">
      <p class="text-sm text-slate-600 mb-3">
        Data like dashboard stats and analytics are cached for up to 10 minutes. Clear the cache if you need to see the latest data immediately.
      </p>
      <div class="flex items-center gap-3">
        <AppButton size="sm" variant="secondary" :loading="clearingCache" @click="clearCache">
          Clear Cache
        </AppButton>
        <p v-if="cacheCleared" class="text-sm text-green-600">{{ cacheCleared }}</p>
      </div>
    </AppCard>

    <!-- Add/Edit Category Modal -->
    <AppModal :open="showAddCategoryModal" :title="editingCategory ? 'Edit Category' : 'Add Category'" @close="closeCategoryModal">
      <form class="space-y-4" @submit.prevent="saveCategory">
        <AppInput v-model="categoryForm.name" label="Category Name" required />
        <AppInput v-model="categoryForm.description" label="Description (Optional)" />
        <AppSelect
          v-model="categoryForm.color"
          label="Color"
          :options="colorOptions"
        />
        <div class="flex gap-2">
          <AppButton type="submit" size="sm" :loading="savingCategory">
            {{ editingCategory ? 'Update' : 'Add' }}
          </AppButton>
          <AppButton type="button" size="sm" variant="secondary" @click="closeCategoryModal">
            Cancel
          </AppButton>
        </div>
        <p v-if="categoryError" class="text-sm text-red-600">{{ categoryError }}</p>
      </form>
    </AppModal>

    <!-- Invite Modal -->
    <AppModal :open="showInviteModal" title="Staff Invitations" size="lg" @close="showInviteModal = false">
      <div class="space-y-4">
        <!-- Generate new invite -->
        <div class="pb-4 border-b border-slate-100">
          <AppButton size="sm" :loading="generatingInvite" @click="generateInvite">
            Generate New Invitation
          </AppButton>
          <p v-if="inviteError" class="mt-2 text-sm text-red-600">{{ inviteError }}</p>
          <p v-if="copySuccess" class="mt-2 text-sm text-green-600">{{ copySuccess }}</p>
          <p v-if="copyError" class="mt-2 text-sm text-red-600">{{ copyError }}</p>
          <p class="mt-1 text-xs text-slate-600">
            {{ pendingInvites.length }} / 10 pending invitations
          </p>
        </div>

        <!-- Active (pending) invites -->
        <div>
          <h4 class="text-sm font-semibold text-slate-800 mb-3">Active Invitations</h4>
          <div v-if="pendingInvites.length === 0">
            <AppEmptyState title="No active invitations" />
          </div>
          <div v-else class="space-y-3">
            <div
              v-for="invite in pendingInvites"
              :key="invite.id"
              class="p-3 bg-slate-50 rounded-lg border border-slate-200"
            >
              <div class="flex items-start justify-between mb-2">
                <div class="flex-1">
                  <div class="flex items-center gap-2">
                    <AppBadge color="blue">{{ invite.status }}</AppBadge>
                    <span class="text-xs text-slate-600">
                      Expires {{ formatExpiry(invite.expiresAt) }}
                    </span>
                  </div>
                  <p class="text-xs text-slate-600 mt-1">
                    Created {{ formatDateTime(invite.createdAt) }}
                  </p>
                </div>
              </div>
              <div class="flex gap-2">
                <AppButton size="sm" variant="secondary" @click="copyInviteLink(invite)">
                  Copy Link
                </AppButton>
                <AppButton
                  size="sm"
                  :style="{ backgroundColor: '#25D366', color: 'white' }"
                  @click="sendViaWhatsApp(invite)"
                >
                  WhatsApp
                </AppButton>
                <AppButton size="sm" variant="danger" @click="revokeInvite(invite.id)">
                  Revoke
                </AppButton>
              </div>
            </div>
          </div>
        </div>

        <!-- Used invites (collapsible) -->
        <div>
          <button
            class="flex items-center gap-2 text-sm font-semibold text-slate-800 hover:text-slate-700"
            @click="showUsedInvites = !showUsedInvites"
          >
            <svg
              class="w-4 h-4 transition-transform"
              :class="{ 'rotate-90': showUsedInvites }"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
            Used Invitations ({{ usedInvites.length }})
          </button>
          <div v-if="showUsedInvites" class="mt-3 space-y-2">
            <div v-if="usedInvites.length === 0" class="text-sm text-slate-600">
              No used invitations
            </div>
            <div
              v-for="invite in usedInvites"
              v-else
              :key="invite.id"
              class="p-3 bg-slate-50 rounded-lg border border-slate-200"
            >
              <div class="flex items-center gap-2 mb-1">
                <AppBadge :color="invite.status === 'accepted' ? 'green' : 'red'">
                  {{ invite.status }}
                </AppBadge>
              </div>
              <p class="text-xs text-slate-600">
                Created {{ formatDateTime(invite.createdAt) }}
              </p>
              <p v-if="invite.acceptedAt && invite.acceptedBy" class="text-xs text-slate-600 mt-1">
                Accepted by {{ invite.acceptedBy.name }} on {{ formatDateTime(invite.acceptedAt) }}
              </p>
              <p v-if="invite.revokedAt" class="text-xs text-slate-600 mt-1">
                Revoked on {{ formatDateTime(invite.revokedAt) }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "dashboard", middleware: "org-required" });

const { orgId, currentOrg } = useOrg();
const { getInviteMessage } = useWhatsApp();
const { copyToClipboard } = useClipboard();

const businessTypes = [
  { value: "gym", label: "Gym / Fitness Center" },
  { value: "library", label: "Library" },
  { value: "tuition", label: "Tuition / Coaching Center" },
  { value: "other", label: "Other" },
];

interface StaffMember {
  id: number;
  userId: number;
  name: string;
  email: string;
  role: string;
}

interface Invite {
  id: number;
  token: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  acceptedAt?: string;
  revokedAt?: string;
  invitedBy: { name: string; email: string };
  acceptedBy?: { name: string; email: string } | null;
  revokedBy?: { name: string; email: string } | null;
}

const orgForm = reactive({ name: currentOrg.value?.name || "", type: currentOrg.value?.type || "" });
const savingOrg = ref(false);

const subscriptionForm = reactive({ gracePeriodDays: String(currentOrg.value?.gracePeriodDays ?? 0) });
const savingSubscriptionSettings = ref(false);

const showInviteModal = ref(false);
const generatingInvite = ref(false);
const inviteError = ref("");
const showUsedInvites = ref(false);
const copySuccess = ref("");
const copyError = ref("");

const isOwner = computed(() => currentOrg.value?.role === "owner");

const clearingCache = ref(false);
const cacheCleared = ref("");

// Expense categories
interface Category {
  id: number;
  name: string;
  description: string | null;
  color: string;
  isActive: boolean;
  isSystem: boolean;
}

const { data: categoriesData, refresh: refreshCategories } = await useFetch<{ categories: Category[] }>(
  `/api/orgs/${orgId.value}/expense-categories`
);
const categories = computed(() => categoriesData.value?.categories ?? []);

const showAddCategoryModal = ref(false);
const editingCategory = ref<Category | null>(null);
const categoryForm = reactive({ name: "", description: "", color: "blue" });
const savingCategory = ref(false);
const categoryError = ref("");

const colorOptions = [
  { value: "blue", label: "Blue" },
  { value: "purple", label: "Purple" },
  { value: "green", label: "Green" },
  { value: "orange", label: "Orange" },
  { value: "pink", label: "Pink" },
  { value: "yellow", label: "Yellow" },
  { value: "red", label: "Red" },
  { value: "indigo", label: "Indigo" },
  { value: "cyan", label: "Cyan" },
  { value: "slate", label: "Slate" },
];

function editCategory(cat: Category) {
  editingCategory.value = cat;
  categoryForm.name = cat.name;
  categoryForm.description = cat.description || "";
  categoryForm.color = cat.color;
  showAddCategoryModal.value = true;
}

function closeCategoryModal() {
  showAddCategoryModal.value = false;
  editingCategory.value = null;
  categoryForm.name = "";
  categoryForm.description = "";
  categoryForm.color = "blue";
  categoryError.value = "";
}

async function saveCategory() {
  savingCategory.value = true;
  categoryError.value = "";
  try {
    if (editingCategory.value) {
      await $fetch(`/api/orgs/${orgId.value}/expense-categories/${editingCategory.value.id}`, {
        method: "PUT",
        body: categoryForm,
      });
    } else {
      await $fetch(`/api/orgs/${orgId.value}/expense-categories`, {
        method: "POST",
        body: categoryForm,
      });
    }
    await refreshCategories();
    closeCategoryModal();
  } catch (e: any) {
    categoryError.value = e.data?.statusMessage || "Failed to save category";
  } finally {
    savingCategory.value = false;
  }
}

async function toggleCategoryStatus(cat: Category) {
  try {
    await $fetch(`/api/orgs/${orgId.value}/expense-categories/${cat.id}`, {
      method: "PUT",
      body: { isActive: !cat.isActive },
    });
    await refreshCategories();
  } catch (e: any) {
    alert(e.data?.statusMessage || "Failed to update category");
  }
}

async function clearCache() {
  clearingCache.value = true;
  cacheCleared.value = "";
  try {
    const result = await $fetch<{ cleared: number }>(`/api/orgs/${orgId.value}/cache`, {
      method: "DELETE",
    });
    cacheCleared.value = `Cleared ${result.cleared} cached ${result.cleared === 1 ? "entry" : "entries"}`;
    setTimeout(() => { cacheCleared.value = ""; }, 5000);
  } catch {
    cacheCleared.value = "Failed to clear cache";
    setTimeout(() => { cacheCleared.value = ""; }, 5000);
  } finally {
    clearingCache.value = false;
  }
}

const { data: staffData, refresh: refreshStaff } = await useFetch<{ staff: StaffMember[] }>(
  `/api/orgs/${orgId.value}/staff`,
);
const staff = computed(() => staffData.value?.staff ?? []);

const { data: invitesData, refresh: refreshInvites } = await useFetch<{ invites: Invite[] }>(
  `/api/orgs/${orgId.value}/invites`,
  { immediate: false },
);

const pendingInvites = computed(() => {
  const now = new Date().toISOString();
  return (invitesData.value?.invites ?? []).filter(
    (inv) => inv.status === "pending" && inv.expiresAt > now
  );
});

const usedInvites = computed(() => {
  return (invitesData.value?.invites ?? []).filter(
    (inv) => inv.status !== "pending" || inv.expiresAt <= new Date().toISOString()
  );
});

async function saveOrg() {
  savingOrg.value = true;
  await $fetch(`/api/orgs/${orgId.value}`, {
    method: "PUT",
    body: orgForm,
  });
  savingOrg.value = false;
}

async function saveSubscriptionSettings() {
  savingSubscriptionSettings.value = true;
  await $fetch(`/api/orgs/${orgId.value}`, {
    method: "PUT",
    body: { gracePeriodDays: Number(subscriptionForm.gracePeriodDays) },
  });
  savingSubscriptionSettings.value = false;
}

async function removeStaff(membershipId: number) {
  await $fetch(`/api/orgs/${orgId.value}/staff/${membershipId}`, {
    method: "DELETE",
  });
  await refreshStaff();
}

async function generateInvite() {
  generatingInvite.value = true;
  inviteError.value = "";
  try {
    await $fetch(`/api/orgs/${orgId.value}/invites`, {
      method: "POST",
    });
    await refreshInvites();
  } catch (e: unknown) {
    const err = e as { data?: { statusMessage?: string } };
    inviteError.value = err.data?.statusMessage || "Failed to generate invitation";
  } finally {
    generatingInvite.value = false;
  }
}

async function copyInviteLink(invite: Invite) {
  copySuccess.value = "";
  copyError.value = "";
  const url = `${window.location.origin}/invite/${invite.token}`;
  const success = await copyToClipboard(url);
  if (success) {
    copySuccess.value = "Invitation link copied to clipboard!";
    setTimeout(() => { copySuccess.value = ""; }, 3000);
  } else {
    copyError.value = "Failed to copy link";
    setTimeout(() => { copyError.value = ""; }, 3000);
  }
}

function sendViaWhatsApp(invite: Invite) {
  const url = `${window.location.origin}/invite/${invite.token}`;
  const message = getInviteMessage(currentOrg.value?.name || "MemberBook", url);
  // For WhatsApp web, we don't need a phone number - just send the message
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, "_blank");
}

async function revokeInvite(inviteId: number) {
  if (!confirm("Are you sure you want to revoke this invitation?")) {
    return;
  }
  inviteError.value = "";
  try {
    await $fetch(`/api/orgs/${orgId.value}/invites/${inviteId}`, {
      method: "DELETE",
    });
    await refreshInvites();
  } catch (e: unknown) {
    const err = e as { data?: { statusMessage?: string } };
    inviteError.value = err.data?.statusMessage || "Failed to revoke invitation";
  }
}

const { formatDateTime } = useFormatDate();

function formatExpiry(dateStr: string): string {
  const expiry = new Date(dateStr);
  const now = new Date();
  const diffMs = expiry.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (diffHours > 24) {
    return `in ${Math.floor(diffHours / 24)} days`;
  } else if (diffHours > 0) {
    return `in ${diffHours}h ${diffMins}m`;
  } else if (diffMins > 0) {
    return `in ${diffMins} minutes`;
  } else {
    return "expired";
  }
}

// Load invites when modal opens
watch(showInviteModal, (isOpen) => {
  if (isOpen) {
    refreshInvites();
  }
});
</script>
