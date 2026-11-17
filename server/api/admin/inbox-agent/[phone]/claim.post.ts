/** For the AI task: take a chat so two runs don't answer it at once. */
export default defineEventHandler(async (event) => {
  await requireAdminAccess(event);
  const phone = cleanPhone(getRouterParam(event, "phone"));
  if (!phone) throw createError({ statusCode: 400, statusMessage: "Invalid phone" });
  if (!(await isAutoReplyOn())) throw createError({ statusCode: 409, statusMessage: "Auto-reply is switched off" });

  const conv = await getConversation(phone);
  const times = await chatTimes(phone);
  const blocked = blockedReason(conv, times);
  if (blocked) throw createError({ statusCode: 409, statusMessage: `Not yours to answer: ${blocked}` });
  if (!isUnanswered(times)) throw createError({ statusCode: 409, statusMessage: "Already answered" });
  if (conv.claimedAt && Date.now() - new Date(conv.claimedAt).getTime() < CLAIM_MS) {
    throw createError({ statusCode: 409, statusMessage: "Another run is answering this chat" });
  }
  await updateConversation(phone, { claimedAt: new Date().toISOString() });
  return { ok: true };
});
