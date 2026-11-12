/** Send today's digest email now (same as the 09:00 IST run). */
export default defineEventHandler(async (event) => {
  await requireAdminAccess(event);
  const to = String(useRuntimeConfig(event).inboxAlertEmail || "");
  const env = event.context.cloudflare?.env as Parameters<typeof sendAdminEmailVia>[0];
  if (!to || !env?.ALERT_EMAIL) {
    throw createError({ statusCode: 400, statusMessage: "Email isn't set up here (needs NUXT_INBOX_ALERT_EMAIL and the ALERT_EMAIL binding)" });
  }
  const digest = await buildAdminDigest(appBaseUrl(event));
  const sent = await sendAdminEmailVia(env, to, digest.subject, digest.text);
  if (!sent) throw createError({ statusCode: 502, statusMessage: "Cloudflare didn't accept the email. Check the Worker logs." });
  await recordAdminAuditLog(event, "digest_sent_manually");
  return { ok: true };
});
