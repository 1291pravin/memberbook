/** Admin inbox: reply to an email thread from support@memberbook.in (pauses the AI there for a while). */
export default defineEventHandler(async (event) => {
  await requireAdminAccess(event);
  const id = Number(getRouterParam(event, "id"));
  const thread = Number.isInteger(id) ? await getThread(id) : null;
  if (!thread) throw createError({ statusCode: 404, statusMessage: "No such email thread" });
  const body = await readBody<{ text?: unknown }>(event).catch(() => ({} as { text?: unknown }));
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  if (!text) throw createError({ statusCode: 400, statusMessage: "Write a reply" });
  if (text.length > 10000) throw createError({ statusCode: 400, statusMessage: "Keep it under 10,000 characters" });
  const sent = await sendEmailReply(id, text, "admin");
  await updateThread(id, { claimedAt: null, alertedAt: null });
  if (!sent.ok) throw createError({ statusCode: 502, statusMessage: `Email not sent: ${sent.error}` });
  return { ok: true };
});
