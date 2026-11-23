// Service worker for the MemberBook admin inbox (added to the phone's home
// screen). It only shows inbox alerts sent by server/utils/web-push.ts and
// opens the right chat when one is tapped. No caching: pages stay live.

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  }
  catch {
    data = { body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "MemberBook inbox";
  event.waitUntil(self.registration.showNotification(title, {
    body: data.body || "New message",
    tag: data.tag || undefined,
    renotify: Boolean(data.tag),
    icon: "/android-chrome-192x192.png",
    badge: "/favicon-32x32.png",
    data: { url: data.url || "/admin/inbox" },
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || "/admin/inbox", self.location.origin).href;
  event.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const win of wins) {
      if (new URL(win.url).pathname.startsWith("/admin")) {
        try {
          await win.focus();
          if (win.navigate) return await win.navigate(url);
        }
        catch { /* fall through and open a new window */ }
      }
    }
    return self.clients.openWindow(url);
  })());
});
