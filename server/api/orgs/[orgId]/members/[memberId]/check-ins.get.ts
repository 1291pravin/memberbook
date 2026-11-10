import { eq, and, count, desc } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const access = event.context.access;
  const memberId = Number(getRouterParam(event, "memberId"));
  const { page, limit, offset } = parsePagination(event, 5);

  const conditions = and(
    eq(schema.checkIns.memberId, memberId),
    eq(schema.checkIns.orgId, access.orgId),
  );

  // Member check, count and page are independent; run them concurrently.
  const [memberRows, [{ total }], checkIns] = await Promise.all([
    // Verify member belongs to org
    db
      .select({ id: schema.members.id })
      .from(schema.members)
      .where(and(
        eq(schema.members.id, memberId),
        eq(schema.members.orgId, access.orgId),
      ))
      .limit(1),

    db
      .select({ total: count() })
      .from(schema.checkIns)
      .where(conditions),

    db
      .select({
        id: schema.checkIns.id,
        checkedInAt: schema.checkIns.checkedInAt,
        checkedOutAt: schema.checkIns.checkedOutAt,
        durationMinutes: schema.checkIns.durationMinutes,
        autoCheckedOut: schema.checkIns.autoCheckedOut,
        subscriptionStatus: schema.checkIns.subscriptionStatus,
        notes: schema.checkIns.notes,
      })
      .from(schema.checkIns)
      .where(conditions)
      .orderBy(desc(schema.checkIns.checkedInAt))
      .limit(limit)
      .offset(offset),
  ]);

  if (!memberRows[0]) {
    throw createError({ statusCode: 404, statusMessage: "Member not found" });
  }

  const { pagination } = buildPaginatedResponse(checkIns, total, { page, limit, offset });
  return { checkIns, pagination };
});
