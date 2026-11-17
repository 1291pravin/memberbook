/**
 * For the AI task: send a WhatsApp reply. Checked against the rules in
 * server/utils/inbox-agent.ts before anything goes out.
 */
export default defineEventHandler(async (event) => {
  await requireAdminAccess(event);
  const phone = cleanPhone(getRouterParam(event, "phone"));
  const body = await readBody<{ text?: unknown; inReplyTo?: unknown }>(event).catch(() => ({} as { text?: unknown; inReplyTo?: unknown }));
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  if (!phone) throw createError({ statusCode: 400, statusMessage: "Invalid phone" });
  if (!(await isAutoReplyOn())) throw createError({ statusCode: 409, statusMessage: "Auto-reply is switched off" });
  if (!canSendWhatsAppCloud()) throw createError({ statusCode: 503, statusMessage: "WhatsApp sending is not configured" });

  const conv = await getConversation(phone);
  const times = await chatTimes(phone);
  const blocked = blockedReason(conv, times);
  if (blocked) throw createError({ statusCode: 409, statusMessage: `Can't reply: ${blocked}` });
  if (Number(body?.inReplyTo) !== times.lastInId) {
    throw createError({ statusCode: 409, statusMessage: "They sent something new. Read the chat again (GET it) and answer their latest message." });
  }
  const sinceIn = await aiRepliesAfterId(phone, times.lastInId!);
  if (sinceIn >= AI_LIMITS.perTurn) throw createError({ statusCode: 429, statusMessage: "You've already replied enough to their last message. Wait for them to write." });
  if (await aiRepliesSince(phone, new Date(Date.now() - 3600000).toISOString()) >= AI_LIMITS.perHour) {
    throw createError({ statusCode: 429, statusMessage: "Too many AI replies to this chat in the last hour. Hand it over instead." });
  }

  const ctx = await contactContext(phone, conv);
  const allowedPhones = [phone, ...ctx.memberOf.map(m => m.ownerWhatsapp ?? "")];
  const problems = checkAiReply(text, allowedPhones);
  if (problems.length) throw createError({ statusCode: 422, statusMessage: `Not sent: ${problems.join("; ")}` });

  const sent = await sendLoggedText(phone, text, "ai");
  await updateConversation(phone, { claimedAt: null, alertedAt: null });
  if (!sent.ok) throw createError({ statusCode: 502, statusMessage: `WhatsApp did not accept the message: ${sent.error}` });
  return { ok: true, id: sent.message.id };
});
