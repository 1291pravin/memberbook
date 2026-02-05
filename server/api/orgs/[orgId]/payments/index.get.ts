import { eq, desc, count } from "drizzle-orm";

export default cachedEventHandler(async (event) => {
  const access = event.context.access;
  const { page, limit, offset } = parsePagination(event, 30);

  // Count query for pagination
  const [{ total }] = await db
    .select({ total: count() })
    .from(schema.payments)
    .where(eq(schema.payments.orgId, access.orgId));

  // Data query with pagination
  const paymentList = await db
    .select({
      id: schema.payments.id,
      amount: schema.payments.amount,
      date: schema.payments.date,
      method: schema.payments.method,
      notes: schema.payments.notes,
      memberId: schema.payments.memberId,
      memberName: schema.members.name,
      memberPhone: schema.members.phone,
    })
    .from(schema.payments)
    .innerJoin(schema.members, eq(schema.payments.memberId, schema.members.id))
    .where(eq(schema.payments.orgId, access.orgId))
    .orderBy(desc(schema.payments.date))
    .limit(limit)
    .offset(offset);

  const { pagination } = buildPaginatedResponse(paymentList, total, { page, limit, offset });
  return { payments: paymentList, pagination };
}, {
  maxAge: 3600,
  getKey: (event) => orgCacheKey(event, "payments"),
});
