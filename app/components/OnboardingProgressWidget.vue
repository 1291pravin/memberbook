<template>
  <AppCard v-if="!isComplete && progress" class="mb-6 bg-gradient-to-r from-primary-50 to-blue-50 border-primary-200">
    <div class="flex items-start justify-between mb-3">
      <div>
        <h3 class="font-semibold text-slate-800 flex items-center gap-2">
          <span class="text-lg">🚀</span>
          Complete Your Setup
        </h3>
        <p class="text-sm text-slate-600 mt-1">
          {{ progress.completedSteps }}/{{ progress.totalSteps }} steps complete
        </p>
      </div>
      <button
        @click="dismissWidget"
        class="text-slate-400 hover:text-slate-600 transition-colors"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>

    <div class="h-2 bg-white rounded-full mb-4 overflow-hidden shadow-inner">
      <div
        class="h-full bg-primary-500 transition-all duration-500"
        :style="{ width: `${progress.percentageComplete}%` }"
      />
    </div>

    <div class="space-y-2">
      <div
        v-for="step in incompleteSteps"
        :key="step.key"
        class="flex items-center justify-between text-sm bg-white rounded-lg px-3 py-2 shadow-sm"
      >
        <span class="text-slate-700 font-medium">{{ step.label }}</span>
        <AppButton
          size="sm"
          variant="ghost"
          @click="goToStep(step.key)"
          class="text-primary-600 hover:text-primary-700"
        >
          Complete →
        </AppButton>
      </div>
    </div>

    <p class="text-xs text-slate-500 mt-3 text-center">
      Completing these steps will help you get the most out of MemberBook
    </p>
  </AppCard>
</template>

<script setup lang="ts">
const { progress, loadProgress, markStepComplete, isComplete } = useOnboarding();

onMounted(() => {
  loadProgress();
});

const incompleteSteps = computed(() =>
  progress.value?.applicableSteps.filter((s: any) => !s.completed && !s.required) || []
);

async function goToStep(stepKey: string) {
  // Dashboard Tour doesn't have a wizard page - just mark it complete
  if (stepKey === 'dashboardTour') {
    await markStepComplete('dashboardTourCompleted');
    return;
  }

  const stepMap: Record<string, string> = {
    staffOnboarding: 'staff',
    plansSetup: 'plans',
    businessSetup: 'seats',
  };
  navigateTo(`/onboarding/wizard/${stepMap[stepKey]}`);
}

async function dismissWidget() {
  // Mark dashboard tour as complete (user acknowledges they've seen the widget)
  await markStepComplete('dashboardTourCompleted');
}
</script>
