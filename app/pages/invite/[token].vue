<template>
  <div class="min-h-[80vh] flex items-center justify-center px-4">
    <AppCard class="w-full max-w-md">
      <!-- Loading State -->
      <div v-if="loading" class="text-center py-8">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        <p class="mt-4 text-sm text-gray-600">Validating invitation...</p>
      </div>

      <!-- Valid - Not Logged In -->
      <div v-else-if="state === 'valid-not-logged-in'" class="space-y-4">
        <div class="text-center">
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary-100">
            <svg class="h-6 w-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 class="mt-4 text-xl font-bold text-gray-900">You're Invited!</h2>
          <p class="mt-2 text-sm text-gray-600">
            You've been invited to join <span class="font-semibold">{{ inviteData?.orgName }}</span> as a staff member.
          </p>
          <div class="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p class="text-sm text-blue-800">
              To accept this invitation, please sign in or create an account first.
            </p>
          </div>
        </div>
        <div class="pt-4 space-y-2">
          <AppButton class="w-full" @click="handleLogin">
            Sign In
          </AppButton>
          <AppButton class="w-full" variant="secondary" @click="handleRegister">
            Create New Account
          </AppButton>
          <p class="text-xs text-center text-gray-500 mt-2">
            You'll return here to accept the invitation after signing in
          </p>
        </div>
      </div>

      <!-- Valid - Logged In -->
      <div v-else-if="state === 'valid-logged-in'" class="space-y-4">
        <div class="text-center">
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary-100">
            <svg class="h-6 w-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 class="mt-4 text-xl font-bold text-gray-900">Accept Invitation</h2>
          <p class="mt-2 text-sm text-gray-600">
            Join <span class="font-semibold">{{ inviteData?.orgName }}</span> as a staff member.
          </p>
        </div>
        <div v-if="error" class="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {{ error }}
        </div>
        <div class="pt-4">
          <AppButton class="w-full" :loading="accepting" @click="handleAccept">
            Accept Invitation
          </AppButton>
        </div>
      </div>

      <!-- Expired -->
      <div v-else-if="state === 'expired'" class="text-center py-4">
        <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
          <svg class="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 class="mt-4 text-xl font-bold text-gray-900">Invitation Expired</h2>
        <p class="mt-2 text-sm text-gray-600">
          This invitation has expired. Please contact the organization owner for a new invitation.
        </p>
      </div>

      <!-- Revoked -->
      <div v-else-if="state === 'revoked'" class="text-center py-4">
        <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
          <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 class="mt-4 text-xl font-bold text-gray-900">Invitation Revoked</h2>
        <p class="mt-2 text-sm text-gray-600">
          This invitation has been revoked. Please contact the organization owner if you think this is a mistake.
        </p>
      </div>

      <!-- Already Accepted -->
      <div v-else-if="state === 'already-accepted'" class="text-center py-4">
        <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
          <svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 class="mt-4 text-xl font-bold text-gray-900">Already Accepted</h2>
        <p class="mt-2 text-sm text-gray-600">
          This invitation has already been accepted.
        </p>
        <div class="pt-4">
          <AppButton class="w-full" @click="navigateTo('/dashboard')">
            Go to Dashboard
          </AppButton>
        </div>
      </div>

      <!-- Already Member -->
      <div v-else-if="state === 'already-member'" class="text-center py-4">
        <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
          <svg class="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 class="mt-4 text-xl font-bold text-gray-900">Already a Member</h2>
        <p class="mt-2 text-sm text-gray-600">
          You are already a member of this organization.
        </p>
        <div class="pt-4">
          <AppButton class="w-full" @click="navigateTo('/dashboard')">
            Go to Dashboard
          </AppButton>
        </div>
      </div>

      <!-- Error -->
      <div v-else-if="state === 'error'" class="text-center py-4">
        <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
          <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 class="mt-4 text-xl font-bold text-gray-900">Something went wrong</h2>
        <p class="mt-2 text-sm text-gray-600">
          {{ error || "Unable to load invitation details." }}
        </p>
      </div>
    </AppCard>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "default" });

const route = useRoute();
const token = route.params.token as string;
const { session } = useUserSession();

const loading = ref(true);
const accepting = ref(false);
const state = ref<"loading" | "valid-not-logged-in" | "valid-logged-in" | "expired" | "revoked" | "already-accepted" | "already-member" | "error">("loading");
const error = ref("");
const inviteData = ref<{ orgName: string; orgType: string } | null>(null);

onMounted(async () => {
  await validateInvite();
});

async function validateInvite() {
  loading.value = true;
  try {
    const data = await $fetch(`/api/invites/${token}`);
    inviteData.value = { orgName: data.orgName, orgType: data.orgType };

    if (data.status === "expired") {
      state.value = "expired";
    } else if (data.status === "revoked") {
      state.value = "revoked";
    } else if (data.status === "accepted") {
      state.value = "already-accepted";
    } else if (data.valid) {
      // Check if logged in
      if (session.value?.user) {
        state.value = "valid-logged-in";
      } else {
        state.value = "valid-not-logged-in";
      }
    } else {
      state.value = "error";
    }
  } catch (e: unknown) {
    const err = e as { data?: { statusMessage?: string } };
    error.value = err.data?.statusMessage || "Failed to validate invitation";
    state.value = "error";
  } finally {
    loading.value = false;
  }
}

function handleLogin() {
  navigateTo(`/login?redirect=/invite/${token}`);
}

function handleRegister() {
  navigateTo(`/register?redirect=/invite/${token}`);
}

async function handleAccept() {
  accepting.value = true;
  error.value = "";
  try {
    await $fetch(`/api/invites/${token}`, {
      method: "POST",
    });
    // Refresh session to get new org
    const { fetch: refreshSession } = useUserSession();
    await refreshSession();
    navigateTo("/dashboard");
  } catch (e: unknown) {
    const err = e as { data?: { statusMessage?: string } };
    error.value = err.data?.statusMessage || "Failed to accept invitation";
    if (error.value.includes("already a member")) {
      state.value = "already-member";
    }
  } finally {
    accepting.value = false;
  }
}
</script>
