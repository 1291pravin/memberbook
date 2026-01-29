interface Org {
  orgId: number;
  name: string;
  slug: string;
  type: string;
  role: string;
}

const currentOrg = ref<Org | null>(null);
const orgsLoaded = ref(false);

export function useOrg() {
  async function loadOrgs() {
    if (orgsLoaded.value) return currentOrg.value ? [currentOrg.value] : [];
    const data = await $fetch<{ orgs: Org[] }>("/api/orgs");
    orgsLoaded.value = true;
    if (data.orgs.length > 0 && !currentOrg.value) {
      currentOrg.value = data.orgs[0] ?? null;
    }
    return data.orgs;
  }

  function setOrg(org: Org) {
    currentOrg.value = org;
    orgsLoaded.value = true;
  }

  function clearOrg() {
    currentOrg.value = null;
    orgsLoaded.value = false;
  }

  const orgId = computed(() => currentOrg.value?.orgId);

  return { currentOrg: readonly(currentOrg), orgsLoaded: readonly(orgsLoaded), orgId, loadOrgs, setOrg, clearOrg };
}
