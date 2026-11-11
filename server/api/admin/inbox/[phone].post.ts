import { and, desc, eq } from "drizzle-orm";

// Reply to a conversation with free text (only inside WhatsApp's 24-hour window).
export default defineEventHandler(async (event) => {
  await requireAdminAccess(event);

  const phone = String(getRouterParam(event, "phone") ?? "").replace(/\D/g, "");
  const body = await readBody(event).catch(() => ({}));
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  if (!phone) throw createError({ statusCode: 400, statusMessage: "Invalid phone" });
  if (!text) throw createError({ statusCode: 400, statusMessage: "Message is empty" });
  if (text.length > 4096) throw createError({ statusCode: 400, statusMessage: "Message is too long" });
  if (!canSendWhatsAppCloud()) throw createError({ statusCode: 503, statusMessage: "WhatsApp sending is not configured yet" });

  const [lastIn] = await db.select({ createdAt: schema.whatsappMessages.createdAt })
    .from(schema.whatsappMessages)
    .where(and(eq(schema.whatsappMessages.phone, phone), eq(schema.whatsappMessages.direction, "in")))
    .orderBy(desc(schema.whatsappMessages.createdAt))
    .limit(1);
  if (!lastIn || Date.now() - new Date(lastIn.createdAt).getTime() >= 24 * 60 * 60 * 1000) {
    throw createError({ statusCode: 409, statusMessage: "More than 24 hours since their last message. WhatsApp only allows an approved template now." });
  }

  const result = await sendWhatsAppText(phone, text);
  const [saved] = await db.insert(schema.whatsappMessages).values({
    waMessageId: result.messageId ?? null,
    direction: "out",
    phone,
    type: "text",
    body: text,
    status: result.ok ? "sent" : "failed",
    error: result.ok ? null : result.error ?? null,
  }).returning();

  await recordAdminAuditLog(event, "whatsapp_inbox_reply", { metadata: { phone, ok: result.ok } });

  if (!result.ok) {
    throw createError({ statusCode: 502, statusMessage: `WhatsApp did not accept the message: ${result.error}` });
  }
  return { ok: true, message: saved };
});
