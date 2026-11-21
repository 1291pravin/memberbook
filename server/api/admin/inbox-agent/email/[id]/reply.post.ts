/** For the AI task: reply by email from support@, in the same thread. Checked before anything goes out. */
export default defineEventHandler(async (event) => {
  await requireAdminAccess(event);
  const id = Number(getRouterParam(event, "id"));
  const body = await readBody<{ text?: unknown; inReplyTo?: unknown }>(event).catch(() => ({} as { text?: unknown; inReplyTo?: unknown }));
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  const thread = Number.isInteger(id) ? await getThread(id) : null;
  if (!thread) throw createError({ statusCode: 404, statusMessage: "No such email thread" });
  if (!(await isAutoReplyOn())) throw createError({ statusCode: 409, statusMessage: "Auto-reply is switched off" });

  const times = await emailTimes(id);
  const blocked = emailBlockedReason(thread, times);
  if (blocked) throw createError({ statusCode: 409, statusMessage: `Can't reply: ${blocked}` });
  if (Number(body?.inReplyTo) !== times.lastInId) {
    throw createError({ statusCode: 409, statusMessage: "They sent something new. Read the thread again (GET it) and answer their latest email." });
  }
  if (await aiEmailRepliesAfter(id, { afterId: times.lastInId! }) >= EMAIL_AI_LIMITS.perTurn) {
    throw createError({ statusCode: 429, statusMessage: "You've already replied to their last email. Wait for them to write." });
  }
  if (await aiEmailRepliesAfter(id, { sinceIso: new Date(Date.now() - 3600000).toISOString() }) >= EMAIL_AI_LIMITS.perHour) {
    throw createError({ statusCode: 429, statusMessage: "Too many AI replies to this thread in the last hour. Hand it over instead." });
  }
  const problems = await checkEmailReply(id, text);
  if (problems.length) throw createError({ statusCode: 422, statusMessage: `Not sent: ${problems.join("; ")}` });

  const sent = await sendEmailReply(id, text, "ai");
  await updateThread(id, { claimedAt: null, alertedAt: null });
  if (!sent.ok) throw createError({ statusCode: 502, statusMessage: `Email not sent: ${sent.error}` });
  return { ok: true, id: sent.message!.id };
});
