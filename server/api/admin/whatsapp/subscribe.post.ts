// Link Meta webhooks to MemberBook so incoming WhatsApp messages reach the admin inbox:
// 1) the app sends the "messages" field to our callback URL, 2) the business account is subscribed to the app.
export default defineEventHandler(async (event) => {
  await requireAdminAccess(event);
  const pub = useRuntimeConfig().public as { appUrl?: string };
  const site = (pub.appUrl || "https://memberbook.in").replace(/\/$/, "");

  const app = await ensureAppWebhook(`${site}/api/webhooks/whatsapp`);
  const waba = await subscribeWebhooks();
  await recordAdminAuditLog(event, "whatsapp_subscribe_webhooks", {
    metadata: { app: app.ok, appError: app.error?.slice(0, 300), before: app.before, after: app.after, waba: waba.ok, wabaError: waba.error?.slice(0, 300) },
  });
  if (!app.ok || !waba.ok) {
    throw createError({ statusCode: 502, statusMessage: `Meta did not link incoming messages: ${[app.error && `app webhook: ${app.error}`, waba.error && `business account: ${waba.error}`].filter(Boolean).join("; ")}` });
  }
  return { ok: true, app: app.after, status: await getPhoneNumberStatus() };
});
