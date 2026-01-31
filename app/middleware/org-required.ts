export default defineNuxtRouteMiddleware(() => {
  const { loggedIn, session } = useUserSession();
  if (!loggedIn.value) {
    return navigateTo("/login");
  }
  if (!session.value?.currentOrg) {
    return navigateTo("/onboarding");
  }
});
