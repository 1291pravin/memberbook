import { desc, eq } from "drizzle-orm";

/** For the AI task: one email thread (last 20 emails, oldest first), notes, cold-email context, and what it may do. */
export default defineEventHandler(async (event) => {
  await requireAdminAccess(event);
  setHeader(event, "Cache-Control", "no-store");
  const id = Number(getRouterParam(event, "id"));
  const thread = Number.isInteger(id) ? await getThread(id) : null;
  if (!thread) throw createError({ statusCode: 404, statusMessage: "No such email thread" });

  const rows = await db.select().from(schema.emailMessages)
    .where(eq(schema.emailMessages.threadId, id))
    .orderBy(desc(schema.emailMessages.id)).limit(20);
  const times = await emailTimes(id);
  const blocked = emailBlockedReason(thread, times);
  const [lead] = await db.select({ businessName: schema.outreachLeads.businessName, businessType: schema.outreachLeads.businessType, city: schema.outreachLeads.city, status: schema.outreachLeads.status, sentAt: schema.outreachLeads.sentAt })
    .from(schema.outreachLeads).where(eq(schema.outreachLeads.email, thread.address)).limit(1);
  const [org] = await db.select({ id: schema.organizations.id, name: schema.organizations.name, type: schema.organizations.type })
    .from(schema.users)
    .innerJoin(schema.orgMemberships, eq(schema.orgMemberships.userId, schema.users.id))
    .innerJoin(schema.organizations, eq(schema.organizations.id, schema.orgMemberships.orgId))
    .where(eq(schema.users.email, thread.address)).limit(1);

  return {
    id,
    from: thread.address,
    name: thread.name,
    subject: thread.subject,
    now: new Date().toISOString(),
    lastInId: times.lastInId,
    canReply: !blocked && emailUnanswered(times),
    cannotReplyBecause: blocked ?? (emailUnanswered(times) ? null : "their last email is already answered"),
    notes: thread.notes,
    context: {
      coldEmailLead: lead ?? null,
      hasMemberBookAccount: org ? { businessName: org.name, type: org.type } : null,
    },
    emails: rows.reverse().map(m => ({
      id: m.id,
      from: m.direction === "in" ? "them" : m.direction === "note" ? "log" : (m.sentBy === "ai" ? "you (AI)" : m.sentBy === "system" ? "MemberBook (automatic)" : "Pravin"),
      subject: m.subject,
      text: m.body,
      attachments: m.attachments ? JSON.parse(m.attachments) : undefined,
      status: m.direction === "out" ? m.status : undefined,
      at: m.createdAt,
    })),
  };
});
