export function useOnboarding() {
  const { orgId } = useOrg();
  const { api } = useApi();

  const progress = ref<any>(null);
  const loading = ref(false);

  async function loadProgress() {
    if (!orgId.value) return;
    loading.value = true;
    try {
      const res = await api<any>(`/api/orgs/${orgId.value}/onboarding/progress`);
      progress.value = res.progress;
    } catch (error) {
      console.error('Failed to load onboarding progress:', error);
    } finally {
      loading.value = false;
    }
  }

  async function markStepComplete(step: string) {
    if (!orgId.value) return;
    try {
      await api(`/api/orgs/${orgId.value}/onboarding/progress`, {
        method: 'PUT',
        body: { [step]: true }
      });
      await loadProgress();
    } catch (error) {
      console.error('Failed to mark step complete:', error);
    }
  }

  const isComplete = computed(() => progress.value?.isComplete ?? false);
  const nextIncompleteStep = computed(() => {
    if (!progress.value) return null;
    const incomplete = progress.value.applicableSteps.find((s: any) => !s.completed && !s.required);
    return incomplete?.key || null;
  });

  return {
    progress,
    loading,
    loadProgress,
    markStepComplete,
    isComplete,
    nextIncompleteStep
  };
}
