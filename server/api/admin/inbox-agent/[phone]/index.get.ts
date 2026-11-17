import { desc, eq } from "drizzle-orm";

/**
 * For the AI task: one chat with what it needs to answer it. The last 40
 * messages (oldest first), its notes, who the contact is, and what it may do.
 */
export default defineEventHandler(async (event) => {
  await requireAdminAccess(event);
  setHeader(event, "Cache-Control", "no-store");
  const phone = cleanPhone(getRouterParam(event, "phone"));
  if (!phone) throw createError({ statusCode: 400, statusMessage: "Invalid phone" });

  const rows = await db.select({
    id: schema.whatsappMessages.id,
    direction: schema.whatsappMessages.direction,
    sentBy: schema.whatsappMessages.sentBy,
    contactName: schema.whatsappMessages.contactName,
    type: schema.whatsappMessages.type,
    body: schema.whatsappMessages.body,
    media: schema.whatsappMessages.media,
    status: schema.whatsappMessages.status,
    createdAt: schema.whatsappMessages.createdAt,
  })
    .from(schema.whatsappMessages)
    .where(eq(schema.whatsappMessages.phone, phone))
    .orderBy(desc(schema.whatsappMessages.id))
    .limit(40);
  if (!rows.length) throw createError({ statusCode: 404, statusMessage: "No chat with this number" });

  const conv = await getConversation(phone);
  const times = await chatTimes(phone);
  const context = await contactContext(phone, conv);
  const blocked = blockedReason(conv, times);

  return {
    phone,
    name: rows.find(r => r.contactName)?.contactName ?? null,
    now: new Date().toISOString(),
    lastInId: times.lastInId,
    windowClosesAt: times.lastInAt ? new Date(new Date(times.lastInAt).getTime() + WINDOW_MS).toISOString() : null,
    canReply: !blocked && isUnanswered(times),
    cannotReplyBecause: blocked ?? (isUnanswered(times) ? null : "their last message is already answered"),
    notes: conv.notes,
    linkedOrgId: conv.orgId,
    context,
    messages: rows.reverse().map((m) => {
      let file: { name: string; type: string; saved: boolean } | null = null;
      if (m.media) {
        try {
          const p = JSON.parse(m.media) as { key?: string; name?: string; type?: string };
          file = { name: String(p.name ?? "file"), type: String(p.type ?? ""), saved: !!p.key };
        }
        catch { /* ignore bad JSON */ }
      }
      return {
        id: m.id,
        from: m.direction === "in" ? "them" : m.direction === "note" ? "log" : (m.sentBy === "ai" ? "you (AI)" : m.sentBy === "system" ? "MemberBook (automatic)" : "Pravin"),
        type: m.type,
        text: m.body,
        file,
        status: m.direction === "out" ? m.status : undefined,
        at: m.createdAt,
      };
    }),
  };
});
