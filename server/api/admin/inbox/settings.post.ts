/**
 * Inbox AI settings: auto-reply on/off, and how the AI is started
 * ("services" = fired on each message, "schedule" = a scheduled task polls).
 */
export default defineEventHandler(async (event) => {
  await requireAdminAccess(event);
  const body = await readBody<{ autoReply?: unknown; runner?: unknown }>(event).catch(() => ({} as { autoReply?: unknown; runner?: unknown }));
  if (body?.autoReply === undefined && body?.runner === undefined) throw createError({ statusCode: 400, statusMessage: "Send autoReply and/or runner" });
  if (body.autoReply !== undefined && typeof body.autoReply !== "boolean") throw createError({ statusCode: 400, statusMessage: "autoReply must be true or false" });
  if (body.runner !== undefined && body.runner !== "services" && body.runner !== "schedule") throw createError({ statusCode: 400, statusMessage: "runner must be services or schedule" });
  if (typeof body.runner === "string") await setInboxRunner(body.runner as "services" | "schedule");
  if (typeof body.autoReply === "boolean") await setAutoReply(body.autoReply);
  await recordAdminAuditLog(event, "inbox_auto_reply", { metadata: { on: body.autoReply, runner: body.runner } });
  const autoReply = await isAutoReplyOn();
  if (autoReply) wakeInboxAgent(event, "auto-reply switched on");
  return { autoReply, runner: await getInboxRunner() };
});
