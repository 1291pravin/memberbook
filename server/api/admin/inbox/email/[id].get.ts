import { and, asc, eq, isNull } from "drizzle-orm";

/** Admin inbox: one email thread. Opening it marks their emails as read. */
export default defineEventHandler(async (event) => {
  await requireAdminAccess(event);
  setHeader(event, "Cache-Control", "no-store");
  const id = Number(getRouterParam(event, "id"));
  const thread = Number.isInteger(id) ? await getThread(id) : null;
  if (!thread) throw createError({ statusCode: 404, statusMessage: "No such email thread" });
  const messages = await db.select().from(schema.emailMessages)
    .where(eq(schema.emailMessages.threadId, id)).orderBy(asc(schema.emailMessages.id)).limit(200);
  await db.update(schema.emailMessages).set({ readAt: new Date().toISOString() })
    .where(and(eq(schema.emailMessages.threadId, id), eq(schema.emailMessages.direction, "in"), isNull(schema.emailMessages.readAt)));
  const times = await emailTimes(id);
  return {
    id,
    address: thread.address,
    name: thread.name,
    subject: thread.subject,
    canSend: !!useRuntimeConfig(event).resendApiKey,
    ai: {
      autoReply: await isAutoReplyOn(),
      mode: thread.mode,
      handoffReason: thread.handoffReason,
      notes: thread.notes,
      pausedUntil: times.lastAdminOutAt ? new Date(new Date(times.lastAdminOutAt).getTime() + ADMIN_HOLD_MS).toISOString() : null,
    },
    messages: messages.map(m => ({
      id: m.id,
      direction: m.direction,
      subject: m.subject,
      body: m.body,
      attachments: m.attachments ? JSON.parse(m.attachments) as { name: string; type: string; size: number }[] : [],
      status: m.status,
      error: m.error,
      sentBy: m.sentBy,
      createdAt: m.createdAt,
    })),
  };
});
