<template>
  <div class="min-h-screen flex items-center justify-center px-4 py-8 bg-slate-50">
    <div class="w-full max-w-2xl">
      <!-- Progress Indicator -->
      <div class="mb-8" v-if="progress">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm text-slate-600">Setup Progress</span>
          <span class="text-sm font-medium">{{ progress.completedSteps }}/{{ progress.totalSteps }}</span>
        </div>
        <div class="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            class="h-full bg-primary-500 transition-all duration-300"
            :style="{ width: `${progress.percentageComplete}%` }"
          />
        </div>
      </div>

      <!-- Step Content -->
      <AppCard>
        <!-- Staff Step -->
        <div v-if="currentStep === 'staff'">
          <div class="text-center mb-6">
            <div class="text-4xl mb-3">👥</div>
            <h2 class="text-2xl font-bold text-slate-800 mb-2">Invite Your Team</h2>
            <p class="text-slate-600">Share this invite link with your staff members so they can join your workspace</p>
          </div>

          <div v-if="inviteLoading" class="text-center py-8">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p class="text-sm text-slate-600 mt-3">Generating invite link...</p>
          </div>

          <div v-else-if="inviteUrl" class="space-y-4">
            <div class="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <p class="text-xs text-slate-500 mb-2">Invite Link (valid for 48 hours)</p>
              <div class="flex items-center gap-2">
                <input
                  type="text"
                  :value="inviteUrl"
                  readonly
                  class="flex-1 text-sm bg-white border border-slate-300 rounded px-3 py-2 text-slate-700"
                />
                <AppButton size="sm" @click="copyInviteLink">
                  {{ copied ? '✓ Copied' : 'Copy' }}
                </AppButton>
              </div>
            </div>

            <div class="flex gap-2">
              <AppButton
                variant="secondary"
                class="flex-1"
                @click="shareViaWhatsApp"
              >
                Share via WhatsApp
              </AppButton>
              <AppButton
                variant="secondary"
                class="flex-1"
                @click="generateNewInvite"
              >
                Generate New Link
              </AppButton>
            </div>

            <p class="text-xs text-slate-500 text-center">
              You can always invite more team members later from Settings
            </p>
          </div>

          <div v-else class="text-center py-4">
            <AppButton @click="generateInvite">Generate Invite Link</AppButton>
          </div>
        </div>

        <!-- Plans Step -->
        <div v-else-if="currentStep === 'plans'">
          <div class="text-center mb-6">
            <div class="text-4xl mb-3">💳</div>
            <h2 class="text-2xl font-bold text-slate-800 mb-2">Create Your First Plan</h2>
            <p class="text-slate-600">Set up a subscription plan to get started with member billing</p>
          </div>

          <form @submit.prevent="createPlan" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Plan Name</label>
              <input
                v-model="planForm.name"
                type="text"
                placeholder="e.g. Monthly Membership"
                required
                class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Price (₹)</label>
              <input
                v-model.number="planForm.price"
                type="number"
                placeholder="e.g. 1000"
                required
                min="1"
                class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Duration</label>
                <input
                  v-model.number="planForm.durationValue"
                  type="number"
                  placeholder="1"
                  required
                  min="1"
                  class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Period</label>
                <select
                  v-model="planForm.durationType"
                  required
                  class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="monthly">Month(s)</option>
                  <option value="yearly">Year(s)</option>
                  <option value="weekly">Week(s)</option>
                  <option value="daily">Day(s)</option>
                </select>
              </div>
            </div>

            <AppButton type="submit" class="w-full" :loading="planLoading">
              Create Plan
            </AppButton>
          </form>

          <p class="text-xs text-slate-500 text-center mt-4">
            You can add more plans later from the Plans page
          </p>
        </div>

        <!-- Seats Step (libraries only) -->
        <div v-else-if="currentStep === 'seats'">
          <div class="text-center mb-6">
            <div class="text-4xl mb-3">🪑</div>
            <h2 class="text-2xl font-bold text-slate-800 mb-2">Setup Library Seats</h2>
            <p class="text-slate-600">Configure your library seating to assign seats to members</p>
          </div>

          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <p class="text-sm text-blue-800 mb-3">
              Seat management is available in your dashboard. You can configure seats, preferences, and assignments from the Seats page.
            </p>
            <NuxtLink to="/dashboard/seats">
              <AppButton variant="secondary" size="sm">
                Go to Seats Management
              </AppButton>
            </NuxtLink>
          </div>

          <p class="text-xs text-slate-500 text-center mt-4">
            You can skip this for now and set up seats later
          </p>
        </div>

        <!-- Complete Step -->
        <div v-else-if="currentStep === 'complete'">
          <div class="text-center py-8">
            <div class="text-6xl mb-4">🎉</div>
            <h2 class="text-3xl font-bold text-slate-800 mb-2">You're All Set!</h2>
            <p class="text-slate-600 mb-6">Your workspace is ready to use. Start adding members and managing your business.</p>
            <AppButton @click="navigateTo('/dashboard')" size="lg">
              Go to Dashboard
            </AppButton>
          </div>
        </div>

        <!-- Navigation -->
        <div class="mt-6 flex justify-between" v-if="currentStep !== 'complete'">
          <AppButton variant="secondary" @click="skipStep">
            Skip for now
          </AppButton>
          <AppButton @click="goToNext" v-if="canProceed">
            Continue →
          </AppButton>
        </div>
      </AppCard>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "default", middleware: "auth" });

useSeoMeta({
  robots: "noindex, nofollow",
});

const route = useRoute();
const { orgId, currentOrg } = useOrg();
const { api } = useApi();
const { progress, loadProgress, markStepComplete } = useOnboarding();

const currentStep = computed(() => route.params.step as string);

// Staff invite state
const inviteUrl = ref("");
const inviteLoading = ref(false);
const copied = ref(false);

// Plan creation state
const planForm = reactive({
  name: "",
  price: 0,
  durationType: "monthly",
  durationValue: 1,
});
const planLoading = ref(false);

// Load progress on mount
onMounted(() => {
  loadProgress();
});

// Generate invite link
async function generateInvite() {
  if (!orgId.value) return;
  inviteLoading.value = true;
  try {
    const res = await api<any>(`/api/orgs/${orgId.value}/invites`, {
      method: 'POST',
    });
    inviteUrl.value = res.inviteUrl;
  } catch (error) {
    console.error('Failed to generate invite:', error);
  } finally {
    inviteLoading.value = false;
  }
}

async function generateNewInvite() {
  await generateInvite();
}

function copyInviteLink() {
  navigator.clipboard.writeText(inviteUrl.value);
  copied.value = true;
  setTimeout(() => {
    copied.value = false;
  }, 2000);
}

function shareViaWhatsApp() {
  const message = encodeURIComponent(`Join our ${currentOrg.value?.name} team on MemberBook: ${inviteUrl.value}`);
  window.open(`https://wa.me/?text=${message}`, '_blank');
}

// Create plan
async function createPlan() {
  if (!orgId.value) return;
  planLoading.value = true;
  try {
    await api(`/api/orgs/${orgId.value}/plans`, {
      method: 'POST',
      body: {
        name: planForm.name,
        price: planForm.price * 100, // Convert to paise
        durationType: planForm.durationType,
        durationValue: planForm.durationValue,
      },
    });
    // Move to next step
    goToNext();
  } catch (error) {
    console.error('Failed to create plan:', error);
  } finally {
    planLoading.value = false;
  }
}

// Navigation logic
const canProceed = computed(() => {
  if (currentStep.value === 'staff') return true; // Can skip
  if (currentStep.value === 'plans') return true; // Can skip
  if (currentStep.value === 'seats') return true; // Can skip
  return false;
});

function getNextStep(): string {
  const isLibrary = currentOrg.value?.type === 'library';

  if (currentStep.value === 'staff') {
    return 'plans';
  } else if (currentStep.value === 'plans') {
    return isLibrary ? 'seats' : 'complete';
  } else if (currentStep.value === 'seats') {
    return 'complete';
  }
  return 'complete';
}

function goToNext() {
  const next = getNextStep();
  navigateTo(`/onboarding/wizard/${next}`);
}

function skipStep() {
  goToNext();
}
</script>
