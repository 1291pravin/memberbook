import { and, asc, eq, isNull } from "drizzle-orm";

// One conversation; opening it marks incoming messages as read.
export default defineEventHandler(async (event) => {
  await requireAdminAccess(event);

  const phone = String(getRouterParam(event, "phone") ?? "").replace(/\D/g, "");
  if (!phone) throw createError({ statusCode: 400, statusMessage: "Invalid phone" });

  const messages = await db.select({
    id: schema.whatsappMessages.id,
    direction: schema.whatsappMessages.direction,
    contactName: schema.whatsappMessages.contactName,
    type: schema.whatsappMessages.type,
    body: schema.whatsappMessages.body,
    status: schema.whatsappMessages.status,
    error: schema.whatsappMessages.error,
    media: schema.whatsappMessages.media,
    createdAt: schema.whatsappMessages.createdAt,
  })
    .from(schema.whatsappMessages)
    .where(eq(schema.whatsappMessages.phone, phone))
    .orderBy(asc(schema.whatsappMessages.createdAt), asc(schema.whatsappMessages.id))
    .limit(500);

  // A photo/file whose download failed when it arrived: try again (Meta keeps it ~30 days).
  for (const m of messages) {
    if (!m.media || m.direction !== "in") continue;
    const parsed = (() => {
      try { return JSON.parse(m.media) as { mediaId?: string; key?: string; type?: string; name?: string }; }
      catch { return null; }
    })();
    if (!parsed?.mediaId || parsed.key) continue;
    const kind = m.type as "image" | "document" | "video" | "audio";
    const saved = await saveIncomingMedia({ id: `retry-${m.id}`, type: kind, [kind]: { id: parsed.mediaId, mime_type: parsed.type, filename: parsed.name } }, phone);
    if (saved?.key) {
      m.media = JSON.stringify(saved);
      await db.update(schema.whatsappMessages).set({ media: m.media }).where(eq(schema.whatsappMessages.id, m.id));
    }
  }

  await db.update(schema.whatsappMessages)
    .set({ readAt: new Date().toISOString() })
    .where(and(eq(schema.whatsappMessages.phone, phone), eq(schema.whatsappMessages.direction, "in"), isNull(schema.whatsappMessages.readAt)));

  const lastIn = [...messages].reverse().find(m => m.direction === "in");
  const windowOpen = !!lastIn && Date.now() - new Date(lastIn.createdAt).getTime() < 24 * 60 * 60 * 1000;

  return {
    phone,
    canSend: canSendWhatsAppCloud(),
    windowOpen,
    messages: messages.map(({ media, ...m }) => {
      let file: { name: string; type: string; saved: boolean } | null = null;
      try {
        const parsed = media ? JSON.parse(media) as { key?: string; name?: string; type?: string } : null;
        if (parsed) file = { name: String(parsed.name ?? "file"), type: String(parsed.type ?? ""), saved: !!parsed.key };
      }
      catch { /* ignore bad JSON */ }
      return { ...m, file };
    }),
  };
});
