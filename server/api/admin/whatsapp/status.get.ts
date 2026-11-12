// State of MemberBook's WhatsApp number in Meta, for the admin inbox.
// Also self-heals the Meta app's webhook subscription: if the app isn't sending the
// "messages" field to our callback, set it (idempotent, admin only).
export default defineEventHandler(async (event) => {
  await requireAdminAccess(event);
  const status = await getPhoneNumberStatus();
  if (status.ok && status.status === "CONNECTED") {
    const pub = useRuntimeConfig().public as { appUrl?: string };
    const callback = `${(pub.appUrl || "https://memberbook.in").replace(/\/$/, "")}/api/webhooks/whatsapp`;
    const app = await getAppWebhook();
    const linked = app.ok && app.subs?.some(s => s.callback_url === callback && s.active !== false && s.fields?.includes("messages"));
    if (app.ok && !linked) {
      const fix = await ensureAppWebhook(callback);
      await recordAdminAuditLog(event, "whatsapp_app_webhook_autofix", { metadata: { ok: fix.ok, error: fix.error?.slice(0, 300), before: fix.before, after: fix.after } });
      return { ...status, appWebhookLinked: fix.ok, appWebhookError: fix.error };
    }
    await recordAdminAuditLog(event, "whatsapp_app_webhook_check", { metadata: { ok: app.ok, linked, subs: app.subs, error: app.error?.slice(0, 300) } });
    return { ...status, appWebhookLinked: linked ?? null, appWebhookError: app.error };
  }
  return status;
});
