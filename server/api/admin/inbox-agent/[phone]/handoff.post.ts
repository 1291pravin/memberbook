/** For the AI task: give a chat to the admin (email + optional holding reply). The AI stops answering it. */
export default defineEventHandler(async (event) => {
  await requireAdminAccess(event);
  const phone = cleanPhone(getRouterParam(event, "phone"));
  const body = await readBody<{ reason?: unknown; summary?: unknown; holdingReply?: unknown }>(event).catch(() => ({} as Record<string, unknown>));
  if (!phone) throw createError({ statusCode: 400, statusMessage: "Invalid phone" });
  const reason = typeof body?.reason === "string" ? body.reason : "";
  if (!reason.trim()) throw createError({ statusCode: 400, statusMessage: "Give a reason" });
  const holding = typeof body?.holdingReply === "string" ? body.holdingReply.trim() : "";
  if (holding) {
    const conv = await getConversation(phone);
    const ctx = await contactContext(phone, conv);
    const problems = checkAiReply(holding, [phone, ...ctx.memberOf.map(m => m.ownerWhatsapp ?? "")]);
    if (problems.length || holding.length > 600) {
      throw createError({ statusCode: 422, statusMessage: `Holding reply not allowed: ${problems.join("; ") || "keep it under 600 characters"}` });
    }
  }
  const res = await handOff(event, phone, {
    reason,
    summary: typeof body?.summary === "string" ? body.summary : "",
    by: "ai",
    holdingReply: holding || null,
  });
  return { ok: true, ...res };
});
