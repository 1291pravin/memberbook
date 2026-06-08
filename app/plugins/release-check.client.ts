const CHECK_INTERVAL_MS = 60_000;

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig();
  const loadedReleaseId = String(config.public.releaseId);
  let checking = false;

  async function checkForNewRelease() {
    if (checking || !navigator.onLine) return;

    checking = true;
    try {
      const latest = await $fetch<{ releaseId: string }>("/api/version", {
        query: { timestamp: Date.now() },
      });

      if (String(latest.releaseId) !== loadedReleaseId) {
        window.location.reload();
      }
    } catch {
      // A failed check should never interrupt normal app usage.
    } finally {
      checking = false;
    }
  }

  const interval = window.setInterval(checkForNewRelease, CHECK_INTERVAL_MS);
  const checkWhenVisible = () => {
    if (document.visibilityState === "visible") void checkForNewRelease();
  };

  window.addEventListener("focus", checkForNewRelease);
  window.addEventListener("online", checkForNewRelease);
  document.addEventListener("visibilitychange", checkWhenVisible);
  nuxtApp.hook("page:finish", checkForNewRelease);
  void checkForNewRelease();

  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      window.clearInterval(interval);
      window.removeEventListener("focus", checkForNewRelease);
      window.removeEventListener("online", checkForNewRelease);
      document.removeEventListener("visibilitychange", checkWhenVisible);
    });
  }
});
