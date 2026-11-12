// Link Meta webhooks to MemberBook so incoming WhatsApp messages reach the admin inbox.
export default defineEventHandler(async (event) => {
  await requireAdminAccess(event);
  const result = await subscribeWebhooks();
  await recordAdminAuditLog(event, "whatsapp_subscribe_webhooks", { metadata: { ok: result.ok, error: result.error?.slice(0, 300) } });
  if (!result.ok) throw createError({ statusCode: 502, statusMessage: `Meta did not link incoming messages: ${result.error}` });
  return { ok: true, status: await getPhoneNumberStatus() };
});
