export function useOrg() {
  const { session } = useUserSession()
  const currentOrg = computed(() => session.value?.currentOrg ?? null)
  const orgId = computed(() => currentOrg.value?.orgId)
  return { currentOrg, orgId }
}
