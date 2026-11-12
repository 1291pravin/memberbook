/** Preview today's digest email. */
export default defineEventHandler(async (event) => {
  await requireAdminAccess(event);
  const digest = await buildAdminDigest(appBaseUrl(event));
  const emailConfigured = Boolean(useRuntimeConfig(event).inboxAlertEmail) && Boolean(event.context.cloudflare?.env?.ALERT_EMAIL);
  return { ...digest, emailConfigured };
});
