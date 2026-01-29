export default defineNuxtRouteMiddleware(async () => {
  const { loggedIn } = useUserSession();
  if (!loggedIn.value) {
    return navigateTo("/login");
  }

  const { currentOrg, loadOrgs } = useOrg();
  if (currentOrg.value) {
    return;
  }

  try {
    const orgs = await loadOrgs();
    if (!orgs || orgs.length === 0) {
      return navigateTo("/onboarding");
    }
  } catch {
    return navigateTo("/login");
  }
});
