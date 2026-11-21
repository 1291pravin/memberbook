/** For the AI task: give an email thread to the admin (email alert + optional holding reply). The AI stops answering it. */
export default defineEventHandler(async (event) => {
  await requireAdminAccess(event);
  const id = Number(getRouterParam(event, "id"));
  const thread = Number.isInteger(id) ? await getThread(id) : null;
  if (!thread) throw createError({ statusCode: 404, statusMessage: "No such email thread" });
  const body = await readBody<{ reason?: unknown; summary?: unknown; holdingReply?: unknown }>(event).catch(() => ({} as Record<string, unknown>));
  const reason = typeof body?.reason === "string" ? body.reason : "";
  if (!reason.trim()) throw createError({ statusCode: 400, statusMessage: "Give a reason" });
  const holding = typeof body?.holdingReply === "string" ? body.holdingReply.trim() : "";
  if (holding) {
    const problems = await checkEmailReply(id, holding);
    if (problems.length || holding.length > 600) {
      throw createError({ statusCode: 422, statusMessage: `Holding reply not allowed: ${problems.join("; ") || "keep it under 600 characters"}` });
    }
  }
  const env = event.context.cloudflare?.env as Parameters<typeof handOffEmail>[0];
  const res = await handOffEmail(env, id, { reason, summary: typeof body?.summary === "string" ? body.summary : "", by: "ai", holdingReply: holding || null });
  return { ok: true, ...res };
});
