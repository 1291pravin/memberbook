export default defineNuxtRouteMiddleware(() => {
  const { loggedIn } = useUserSession();
  if (!loggedIn.value) {
    return navigateTo("/login");
  }

  const { currentOrg, orgsLoaded } = useOrg();
  if (orgsLoaded.value && !currentOrg.value) {
    return navigateTo("/onboarding");
  }
});
