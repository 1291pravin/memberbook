import { eq, and, like, or, isNull, count, desc } from "drizzle-orm";

export default cachedEventHandler(async (event) => {
  const access = event.context.access;
  const query = getQuery(event);
  const status = query.status as string | undefined;
  const search = query.search as string | undefined;
  const { page, limit, offset } = parsePagination(event, 20);

  const conditions = [eq(schema.checkIns.orgId, access.orgId)];

  if (status === "active") {
    conditions.push(isNull(schema.checkIns.checkedOutAt));
  }

  if (search) {
    conditions.push(
      or(
        like(schema.members.name, `%${search}%`),
        like(schema.members.phone, `%${search}%`),
      )!,
    );
  }

  const whereClause = and(...conditions);

  const [{ total }] = await db
    .select({ total: count() })
    .from(schema.checkIns)
    .innerJoin(schema.members, eq(schema.checkIns.memberId, schema.members.id))
    .where(whereClause);

  const checkIns = await db
    .select({
      id: schema.checkIns.id,
      memberId: schema.checkIns.memberId,
      memberName: schema.members.name,
      memberPhone: schema.members.phone,
      checkedInAt: schema.checkIns.checkedInAt,
      checkedOutAt: schema.checkIns.checkedOutAt,
      durationMinutes: schema.checkIns.durationMinutes,
      autoCheckedOut: schema.checkIns.autoCheckedOut,
      subscriptionStatus: schema.checkIns.subscriptionStatus,
      notes: schema.checkIns.notes,
    })
    .from(schema.checkIns)
    .innerJoin(schema.members, eq(schema.checkIns.memberId, schema.members.id))
    .where(whereClause)
    .orderBy(desc(schema.checkIns.checkedInAt))
    .limit(limit)
    .offset(offset);

  const { pagination } = buildPaginatedResponse(checkIns, total, { page, limit, offset });
  return { checkIns, pagination };
}, {
  maxAge: 60,
  getKey: (event) => orgCacheKey(event, "check-ins"),
});
