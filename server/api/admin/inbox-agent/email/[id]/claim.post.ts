/** For the AI task: take an email thread so two runs don't answer it at once. */
export default defineEventHandler(async (event) => {
  await requireAdminAccess(event);
  const id = Number(getRouterParam(event, "id"));
  const thread = Number.isInteger(id) ? await getThread(id) : null;
  if (!thread) throw createError({ statusCode: 404, statusMessage: "No such email thread" });
  if (!(await isAutoReplyOn())) throw createError({ statusCode: 409, statusMessage: "Auto-reply is switched off" });
  const times = await emailTimes(id);
  const blocked = emailBlockedReason(thread, times);
  if (blocked) throw createError({ statusCode: 409, statusMessage: `Not yours to answer: ${blocked}` });
  if (!emailUnanswered(times)) throw createError({ statusCode: 409, statusMessage: "Already answered" });
  if (thread.claimedAt && Date.now() - new Date(thread.claimedAt).getTime() < CLAIM_MS) {
    throw createError({ statusCode: 409, statusMessage: "Another run is answering this thread" });
  }
  await updateThread(id, { claimedAt: new Date().toISOString() });
  return { ok: true };
});
