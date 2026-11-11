// Register the WhatsApp number for the Cloud API and link webhooks to it.
export default defineEventHandler(async (event) => {
  await requireAdminAccess(event);
  const body = await readBody(event).catch(() => ({}));
  const pin = typeof body?.pin === "string" ? body.pin.trim() : "";
  if (!/^\d{6}$/.test(pin)) throw createError({ statusCode: 400, statusMessage: "PIN must be 6 digits" });

  const result = await registerPhoneNumber(pin);
  await recordAdminAuditLog(event, "whatsapp_register_number", { metadata: { ok: result.ok, subscribed: result.subscribed ?? false } });
  if (!result.ok) throw createError({ statusCode: 502, statusMessage: `Meta did not register the number: ${result.error}` });
  return { ...result, status: await getPhoneNumberStatus() };
});
