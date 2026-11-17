/** Switch AI auto-replies for the WhatsApp inbox on or off. */
export default defineEventHandler(async (event) => {
  await requireAdminAccess(event);
  const body = await readBody<{ autoReply?: unknown }>(event).catch(() => ({} as { autoReply?: unknown }));
  if (typeof body?.autoReply !== "boolean") throw createError({ statusCode: 400, statusMessage: "autoReply must be true or false" });
  await setAutoReply(body.autoReply);
  await recordAdminAuditLog(event, "inbox_auto_reply", { metadata: { on: body.autoReply } });
  if (body.autoReply) wakeInboxAgent(event, "auto-reply switched on");
  return { autoReply: body.autoReply };
});
