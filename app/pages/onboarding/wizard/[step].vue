<template>
  <div class="min-h-screen flex items-center justify-center px-4 py-8 bg-slate-50">
    <div class="w-full max-w-2xl">
      <!-- The upload step is step 3 of sign-up and finishes it -->
      <SignupSteps v-if="currentStep === 'upload'" :current="3" />

      <!-- Progress Indicator (do-it-yourself steps) -->
      <div class="mb-8" v-if="progress && currentStep !== 'complete' && currentStep !== 'upload'">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium text-slate-800">Step {{ currentStepNumber }} of {{ totalWizardSteps }}: {{ currentStepLabel }}</span>
        </div>
        <div class="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            class="h-full bg-primary-500 transition-all duration-300"
            :style="{ width: `${(currentStepNumber / totalWizardSteps) * 100}%` }"
          />
        </div>
      </div>

      <!-- Step Content -->
      <AppCard class="!rounded-[32px] !p-6 sm:!p-8">
        <!-- Upload Step: the owner sends their data once and we load it -->
        <div v-if="currentStep === 'upload'">
          <div class="text-center mb-6">
            <h2 class="text-3xl font-extrabold tracking-tight text-slate-800">Send us your {{ t.memberLower }} list. <span class="serif-accent text-primary-600">That's it.</span></h2>
            <p class="mt-2 text-slate-600">Photos of your register, an Excel sheet or a pasted list, in any format. We add your plans, {{ t.membersLower }} and due dates, then remind them before they're due.</p>
          </div>

          <DataUploadForm show-upi @uploaded="navigateTo('/dashboard')" />

          <p class="mt-6 text-center text-sm text-slate-600">
            Don't have it handy?
            <NuxtLink to="/dashboard" class="font-semibold text-primary-700 hover:underline">Send it later</NuxtLink>
            ·
            <button type="button" class="font-semibold text-primary-700 hover:underline" @click="goToNext">
              I'll set it up myself
            </button>
          </p>
        </div>

        <!-- Members Step: get real members in before anything else -->
        <div v-else-if="currentStep === 'members'">
          <div class="text-center mb-6">
            <div class="text-4xl mb-3">📋</div>
            <h2 class="text-2xl font-bold text-slate-800 mb-2">Add Your {{ t.members }}</h2>
            <p class="text-slate-600">Paste your list from Excel or WhatsApp. It takes a minute, and then MemberBook can track renewals and dues for you.</p>
          </div>

          <MemberImportPanel :cancellable="false" @imported="membersAdded = true" @done="goToNext" />

          <p class="mt-4 text-center text-sm text-slate-600">
            Only a few {{ t.membersLower }}?
            <NuxtLink to="/dashboard/members/new" class="font-medium text-primary-700 hover:underline">Add them one by one</NuxtLink>
          </p>
        </div>

        <!-- Staff Step (last, and optional: most owners run it alone) -->
        <div v-else-if="currentStep === 'staff'">
          <div class="text-center mb-6">
            <div class="text-4xl mb-3">👥</div>
            <h2 class="text-2xl font-bold text-slate-800 mb-2">Does anyone help you run {{ currentOrg?.name || 'your business' }}?</h2>
            <p class="text-slate-600">If you have staff at the front desk, share a link so they can record payments and check-ins too.</p>
          </div>

          <div v-if="!wantsInvite && !inviteUrl" class="grid gap-3 sm:grid-cols-2">
            <AppButton variant="secondary" size="lg" @click="runsAlone">No, I run it alone</AppButton>
            <AppButton size="lg" @click="wantsInvite = true; generateInvite()">Yes, invite my staff</AppButton>
          </div>

          <div v-else-if="inviteLoading" class="text-center py-8">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p class="text-sm text-slate-600 mt-3">Generating invite link...</p>
          </div>

          <div v-else-if="inviteUrl" class="space-y-4">
            <div class="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <p class="text-xs text-slate-600 mb-2">Invite Link (valid for 48 hours)</p>
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

            <p class="text-xs text-slate-600 text-center">
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

          <p class="text-xs text-slate-600 text-center mt-4">
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

          <p class="text-xs text-slate-600 text-center mt-4">
            You can skip this for now and set up seats later
          </p>
        </div>

        <!-- Complete Step -->
        <div v-else-if="currentStep === 'complete'">
          <div class="text-center py-8">
            <div class="text-6xl mb-4">🎉</div>
            <h2 class="text-3xl font-bold text-slate-800 mb-2">You're All Set!</h2>
            <p class="text-slate-600 mb-6">Your workspace is ready.</p>

            <div v-if="!membersAdded" class="mx-auto mb-6 max-w-md rounded-lg border border-amber-200 bg-amber-50 p-4 text-left">
              <p class="text-sm font-medium text-amber-900">You haven't added any {{ t.membersLower }} yet</p>
              <p class="mt-0.5 text-sm text-amber-800">MemberBook is only useful once your {{ t.membersLower }} are in. Paste your list, or send us photos of your register and we'll do it for you.</p>
              <NuxtLink to="/onboarding/wizard/members" class="mt-2 inline-block text-sm font-semibold text-amber-900 underline">Add {{ t.membersLower }} now</NuxtLink>
            </div>

            <AppButton @click="navigateTo('/dashboard')" size="lg">
              Go to Dashboard
            </AppButton>
          </div>
        </div>

        <!-- Navigation -->
        <div class="mt-6 flex justify-between" v-if="currentStep !== 'complete' && currentStep !== 'upload' && !(currentStep === 'staff' && !wantsInvite && !inviteUrl)">
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
const { trackFunnelStep } = useAnalytics();
const t = useTerminology();

const currentStep = computed(() => route.params.step as string);

// Step numbering
const wizardSteps = computed(() => {
  const isLibrary = currentOrg.value?.type === 'library';
  const steps = [
    { key: 'upload', label: `Send Your ${t.value.members} List` },
    { key: 'plans', label: 'Create Your First Plan' },
  ];
  if (isLibrary) steps.push({ key: 'seats', label: 'Setup Library Seats' });
  steps.push({ key: 'members', label: `Add Your ${t.value.members}` });
  steps.push({ key: 'staff', label: 'Your Team (optional)' });
  return steps;
});
const totalWizardSteps = computed(() => wizardSteps.value.length);
const currentStepNumber = computed(() => {
  const idx = wizardSteps.value.findIndex(s => s.key === currentStep.value);
  return idx >= 0 ? idx + 1 : 1;
});
const currentStepLabel = computed(() => {
  const step = wizardSteps.value.find(s => s.key === currentStep.value);
  return step?.label ?? '';
});

// Members step state (shared with the complete step's reminder)
const membersAdded = useState("onboarding-members-added", () => false);

// Staff invite state
const wantsInvite = ref(false);
const inviteUrl = ref("");
const inviteLoading = ref(false);
const copied = ref(false);

interface InviteResponse {
  inviteUrl: string
}

// Plan creation state
const planForm = reactive({
  name: "",
  price: 0,
  durationType: "monthly",
  durationValue: 1,
});
const planLoading = ref(false);

// Load progress on mount, auto-complete dashboard tour on completion
onMounted(async () => {
  await loadProgress();
  if (currentStep.value === 'complete') {
    await markStepComplete('dashboardTourCompleted');
    trackFunnelStep("onboarding_completed", {
      org_id: orgId.value,
      business_type: currentOrg.value?.type,
    });
  }
});

// Generate invite link
async function generateInvite() {
  if (!orgId.value) return;
  inviteLoading.value = true;
  try {
    const res = await api<InviteResponse>(`/api/orgs/${orgId.value}/invites`, {
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
  // Every step can be skipped. The members step moves on from its own Done button.
  return ['plans', 'seats', 'staff'].includes(currentStep.value);
});

function getNextStep(): string {
  const keys = wizardSteps.value.map(s => s.key);
  const idx = keys.indexOf(currentStep.value);
  return idx >= 0 && idx < keys.length - 1 ? keys[idx + 1]! : 'complete';
}

function goToNext() {
  const next = getNextStep();
  navigateTo(`/onboarding/wizard/${next}`);
}

async function runsAlone() {
  await markStepComplete('staffOnboardingCompleted');
  goToNext();
}

function skipStep() {
  goToNext();
}
</script>
