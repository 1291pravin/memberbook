import { and, eq } from "drizzle-orm";

/** Admin inbox: "I'll reply" (human) or "Let AI reply" (auto) for one email thread. */
export default defineEventHandler(async (event) => {
  await requireAdminAccess(event);
  const id = Number(getRouterParam(event, "id"));
  const thread = Number.isInteger(id) ? await getThread(id) : null;
  if (!thread) throw createError({ statusCode: 404, statusMessage: "No such email thread" });
  const body = await readBody<{ mode?: unknown }>(event).catch(() => ({} as { mode?: unknown }));
  const mode = body?.mode === "human" ? "human" : body?.mode === "auto" ? "auto" : null;
  if (!mode) throw createError({ statusCode: 400, statusMessage: "mode must be auto or human" });
  if (mode === "human") await updateThread(id, { mode, handoffReason: "you took over", handoffAt: new Date().toISOString(), claimedAt: null });
  else {
    await updateThread(id, { mode, handoffReason: null, handoffAt: null });
    // The admin's own replies pause the AI; handing back means "go ahead now".
    await db.update(schema.emailMessages).set({ sentBy: "admin_released" })
      .where(and(eq(schema.emailMessages.threadId, id), eq(schema.emailMessages.direction, "out"), eq(schema.emailMessages.sentBy, "admin")));
  }
  await addEmailNote(id, mode === "human" ? "You took over this thread." : "AI replies switched back on.", "admin");
  await recordAdminAuditLog(event, "inbox_email_mode", { metadata: { threadId: id, mode } });
  if (mode === "auto" && emailUnanswered(await emailTimes(id))) wakeInboxAgent(event, "email thread handed back to the AI");
  return { ok: true };
});
