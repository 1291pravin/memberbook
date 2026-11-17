/** For the AI task: their message needs no reply (a reaction, "ok", "thanks"). Logged in the chat. */
export default defineEventHandler(async (event) => {
  await requireAdminAccess(event);
  const phone = cleanPhone(getRouterParam(event, "phone"));
  const body = await readBody<{ reason?: unknown }>(event).catch(() => ({} as { reason?: unknown }));
  if (!phone) throw createError({ statusCode: 400, statusMessage: "Invalid phone" });
  const reason = typeof body?.reason === "string" ? body.reason.replace(/\s+/g, " ").trim().slice(0, 200) : "";
  await addInboxNote(phone, `AI: no reply needed${reason ? ` (${reason})` : ""}`, "ai");
  await updateConversation(phone, { claimedAt: null, alertedAt: null });
  return { ok: true };
});
