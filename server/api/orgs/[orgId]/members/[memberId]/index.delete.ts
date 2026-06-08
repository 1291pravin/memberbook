import { and, eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const access = event.context.access;
  requireOwner(access);

  const memberId = Number(getRouterParam(event, "memberId"));
  if (!Number.isInteger(memberId) || memberId <= 0) {
    throw createError({ statusCode: 400, statusMessage: "Invalid member ID" });
  }

  const [member] = await db
    .select({ id: schema.members.id })
    .from(schema.members)
    .where(and(eq(schema.members.id, memberId), eq(schema.members.orgId, access.orgId)))
    .limit(1);

  if (!member) {
    throw createError({ statusCode: 404, statusMessage: "Member not found" });
  }

  // Member relationships do not cascade, so remove dependent records first.
  await db.batch([
    db.delete(schema.memberSeatAssignments).where(and(
      eq(schema.memberSeatAssignments.memberId, memberId),
      eq(schema.memberSeatAssignments.orgId, access.orgId),
    )),
    db.delete(schema.checkIns).where(and(
      eq(schema.checkIns.memberId, memberId),
      eq(schema.checkIns.orgId, access.orgId),
    )),
    db.delete(schema.payments).where(and(
      eq(schema.payments.memberId, memberId),
      eq(schema.payments.orgId, access.orgId),
    )),
    db.delete(schema.memberSubscriptions).where(and(
      eq(schema.memberSubscriptions.memberId, memberId),
      eq(schema.memberSubscriptions.orgId, access.orgId),
    )),
    db.delete(schema.members).where(and(
      eq(schema.members.id, memberId),
      eq(schema.members.orgId, access.orgId),
    )),
  ]);


  await invalidateCache(access.orgId);
  return { success: true };
});
