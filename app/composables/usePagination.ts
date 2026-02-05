export function usePagination(defaultLimit = 20) {
  const _page = ref(1);
  const limit = defaultLimit;
  const total = ref(0);
  const totalPages = ref(1);

  const page = computed(() => _page.value);
  const hasPrev = computed(() => _page.value > 1);
  const hasNext = computed(() => _page.value < totalPages.value);

  function goToPage(p: number) {
    _page.value = Math.max(1, Math.min(p, totalPages.value));
  }

  function nextPage() {
    if (hasNext.value) _page.value++;
  }

  function prevPage() {
    if (hasPrev.value) _page.value--;
  }

  function resetPage() {
    _page.value = 1;
  }

  function updateFromResponse(pagination: { page: number; total: number; totalPages: number } | undefined) {
    if (!pagination) return;
    total.value = pagination.total;
    totalPages.value = pagination.totalPages;
    _page.value = pagination.page;
  }

  return {
    _page,
    page,
    limit,
    total,
    totalPages,
    hasPrev,
    hasNext,
    goToPage,
    nextPage,
    prevPage,
    resetPage,
    updateFromResponse,
  };
}
