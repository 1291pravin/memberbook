/**
 * Admin: email someone from support@memberbook.in as a new conversation
 * { to, name?, subject, text }. Their reply comes back into /admin/inbox and the AI answers it
 * like any other email (sent as "system", so it doesn't pause the AI).
 */
export default defineEventHandler(async (event) => {
  await requireAdminAccess(event);
  const body = await readBody<{ to?: unknown; name?: unknown; subject?: unknown; text?: unknown }>(event).catch(() => ({} as Record<string, unknown>));
  const to = normaliseEmail(body?.to);
  const subject = typeof body?.subject === "string" ? body.subject.trim() : "";
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  if (!to) throw createError({ statusCode: 400, statusMessage: "A valid to address is needed" });
  if (!subject || subject.length > 200) throw createError({ statusCode: 400, statusMessage: "Subject is needed (under 200 characters)" });
  if (!text || text.length > 10000) throw createError({ statusCode: 400, statusMessage: "Text is needed (under 10,000 characters)" });
  const name = typeof body?.name === "string" && body.name.trim() ? body.name.trim().slice(0, 120) : null;
  const sent = await sendNewEmail({ to, name, subject, text, by: "system" });
  if (!sent.ok) throw createError({ statusCode: 502, statusMessage: `Email not sent: ${sent.error}` });
  return { ok: true, threadId: sent.threadId };
});
