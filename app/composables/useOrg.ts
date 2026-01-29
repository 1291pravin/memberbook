interface Org {
  orgId: number;
  name: string;
  slug: string;
  type: string;
  role: string;
}

const currentOrg = ref<Org | null>(null);

export function useOrg() {
  async function loadOrgs() {
    const data = await $fetch<{ orgs: Org[] }>("/api/orgs");
    if (data.orgs.length > 0 && !currentOrg.value) {
      currentOrg.value = data.orgs[0];
    }
    return data.orgs;
  }

  function setOrg(org: Org) {
    currentOrg.value = org;
  }

  const orgId = computed(() => currentOrg.value?.orgId);

  return { currentOrg: readonly(currentOrg), orgId, loadOrgs, setOrg };
}
