export default defineNuxtRouteMiddleware(async (to) => {
  const requestFetch = useRequestFetch();
  const session = await requestFetch<{ authenticated: boolean }>("/api/admin/session").catch(() => null);

  if (!session?.authenticated) {
    return navigateTo(`/admin?redirect=${encodeURIComponent(to.fullPath)}`);
  }
});
