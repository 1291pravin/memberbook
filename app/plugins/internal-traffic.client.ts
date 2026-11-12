/**
 * Keep the MemberBook team's own browsing out of the numbers. Opening any
 * /admin page marks this browser as internal (localStorage) and from then on
 * Google Analytics and our first-party page-view beacon both skip it.
 * Visit any page with ?internal=0 to undo.
 */
export default defineNuxtPlugin({
  name: "internal-traffic",
  setup() {
  const router = useRouter();
  const { disableAnalytics, enableAnalytics } = useGtag();

  function apply(path: string, query: Record<string, unknown>) {
    try {
      if (path.startsWith("/admin")) localStorage.setItem(INTERNAL_KEY, "1");
      if (query.internal === "0") localStorage.removeItem(INTERNAL_KEY);
    }
    catch { /* storage blocked */ }
    if (isInternalBrowser()) disableAnalytics();
    else enableAnalytics();
  }

  apply(router.currentRoute.value.path, router.currentRoute.value.query);
  router.beforeEach(to => apply(to.path, to.query));
  },
});
