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
    createdAt: schema.whatsappMessages.createdAt,
  })
    .from(schema.whatsappMessages)
    .where(eq(schema.whatsappMessages.phone, phone))
    .orderBy(asc(schema.whatsappMessages.createdAt), asc(schema.whatsappMessages.id))
    .limit(500);

  await db.update(schema.whatsappMessages)
    .set({ readAt: new Date().toISOString() })
    .where(and(eq(schema.whatsappMessages.phone, phone), eq(schema.whatsappMessages.direction, "in"), isNull(schema.whatsappMessages.readAt)));

  const lastIn = [...messages].reverse().find(m => m.direction === "in");
  const windowOpen = !!lastIn && Date.now() - new Date(lastIn.createdAt).getTime() < 24 * 60 * 60 * 1000;

  return { phone, canSend: canSendWhatsAppCloud(), windowOpen, messages };
});
