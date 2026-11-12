/**
 * First-party page-view tracking for the public site (see server/api/t.post.ts).
 * The first page of each browser-tab visit is the "landing" page and carries the
 * referrer and UTM tags; later pages only carry their path. The logged-in app
 * (/dashboard, /admin) is not tracked here; app usage is in user_activity_days.
 */
const SKIP = /^\/(dashboard|admin|pay\/|checkin\/|s\/)/;
const LANDED_KEY = "mb_landed";

export default defineNuxtPlugin({
  name: "site-visits",
  dependsOn: ["internal-traffic"],
  setup(nuxtApp) {
  const router = useRouter();
  let lastPath = "";

  function send(fullPath: string) {
    const path = fullPath.split("#")[0] ?? "/";
    if (SKIP.test(path) || path === lastPath || isInternalBrowser()) return;
    lastPath = path;

    let landing = true;
    try {
      landing = !sessionStorage.getItem(LANDED_KEY);
      sessionStorage.setItem(LANDED_KEY, "1");
    }
    catch { /* private mode: treat every page as a landing */ }

    const body = JSON.stringify({ u: path, r: landing ? document.referrer : undefined, l: landing ? 1 : 0 });
    // fetch (not sendBeacon) so the visitor-id cookie in the response is always stored.
    fetch("/api/t", { method: "POST", body, keepalive: true, credentials: "same-origin", headers: { "Content-Type": "text/plain" } }).catch(() => {});
  }

  nuxtApp.hook("app:mounted", () => send(router.currentRoute.value.fullPath));
  router.afterEach((to, from) => {
    if (from.matched.length === 0) return; // initial navigation, handled on mount
    send(to.fullPath);
  });
  },
});
