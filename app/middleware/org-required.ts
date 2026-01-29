export default defineNuxtRouteMiddleware(async () => {
  const { loggedIn } = useUserSession();
  if (!loggedIn.value) {
    return navigateTo("/login");
  }

  try {
    const data = await $fetch<{ orgs: Array<{ orgId: number }> }>("/api/orgs");
    if (!data.orgs || data.orgs.length === 0) {
      return navigateTo("/onboarding");
    }
  } catch {
    return navigateTo("/login");
  }
});
