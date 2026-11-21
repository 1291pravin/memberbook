/** For the AI task: this email needs no reply (a thank-you, an obvious spam). Logged in the thread. */
export default defineEventHandler(async (event) => {
  await requireAdminAccess(event);
  const id = Number(getRouterParam(event, "id"));
  const thread = Number.isInteger(id) ? await getThread(id) : null;
  if (!thread) throw createError({ statusCode: 404, statusMessage: "No such email thread" });
  const body = await readBody<{ reason?: unknown }>(event).catch(() => ({} as { reason?: unknown }));
  const reason = typeof body?.reason === "string" ? body.reason.replace(/\s+/g, " ").trim().slice(0, 200) : "";
  await addEmailNote(id, `AI: no reply needed${reason ? ` (${reason})` : ""}`, "ai");
  await updateThread(id, { claimedAt: null, alertedAt: null });
  return { ok: true };
});
