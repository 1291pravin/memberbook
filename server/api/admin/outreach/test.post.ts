/**
 * Send the first email and the follow-up as they'd look for a sample lead to `to`
 * (default support@memberbook.in). Works while NUXT_OUTREACH_ENABLED is off, so the
 * copy and Resend setup can be checked before anything goes to real businesses.
 */
export default defineEventHandler(async (event) => {
  await requireAdminAccess(event);
  const cfg = outreachConfig();
  if (!cfg.apiKey) throw createError({ statusCode: 400, statusMessage: "NUXT_RESEND_API_KEY is not set" });
  const body = await readBody<{ to?: unknown }>(event).catch(() => ({} as { to?: unknown }));
  const to = normaliseEmail(body?.to ?? OUTREACH_REPLY_TO);
  if (!to) throw createError({ statusCode: 400, statusMessage: "to must be an email" });
  const sample = {
    id: 0, email: to, businessName: "Test Fitness Studio", contactName: "Ravi", businessType: "gym", city: "Panvel",
    sourceUrl: null, status: "new", token: "test-token", sentAt: null, followedUpAt: null, lastError: null, notes: null,
    createdAt: "", updatedAt: "",
  };
  const ids: string[] = [];
  for (const kind of ["first", "follow_up"] as const) {
    const mail = outreachEmail(sample, kind, cfg.appUrl);
    ids.push(await sendViaResend(cfg.apiKey, { to, ...mail, subject: `[TEST] ${mail.subject}` }));
  }
  return { sent: ids.length, to, ids };
});
