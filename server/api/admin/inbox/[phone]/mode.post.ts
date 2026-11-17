import { sql } from "drizzle-orm";

/**
 * "I'll reply" (human) or "Let AI reply" (auto) for one chat. Handing back to
 * the AI also lifts the pause from the admin's own recent replies.
 */
export default defineEventHandler(async (event) => {
  await requireAdminAccess(event);
  const phone = cleanPhone(getRouterParam(event, "phone"));
  const body = await readBody<{ mode?: unknown }>(event).catch(() => ({} as { mode?: unknown }));
  if (!phone) throw createError({ statusCode: 400, statusMessage: "Invalid phone" });
  if (body?.mode !== "auto" && body?.mode !== "human") throw createError({ statusCode: 400, statusMessage: "mode must be auto or human" });

  if (body.mode === "human") {
    await updateConversation(phone, { mode: "human", handoffReason: "you took over", handoffAt: new Date().toISOString(), claimedAt: null });
    await addInboxNote(phone, "You took over this chat. The AI won't reply until you hand it back.", "admin");
  }
  else {
    await updateConversation(phone, { mode: "auto", handoffReason: null, handoffAt: null });
    // The admin's own replies pause the AI; handing back means "go ahead now".
    await db.update(schema.whatsappMessages).set({ sentBy: "admin_released" })
      .where(sql`${schema.whatsappMessages.phone} = ${phone} AND ${schema.whatsappMessages.direction} = 'out' AND (${schema.whatsappMessages.sentBy} IS NULL OR ${schema.whatsappMessages.sentBy} = 'admin')`);
    await addInboxNote(phone, "You handed this chat to the AI.", "admin");
    wakeInboxAgent(event, `admin handed +${phone} to the AI`);
  }
  await recordAdminAuditLog(event, "inbox_chat_mode", { metadata: { phone, mode: body.mode } });
  return { ok: true, mode: body.mode };
});
