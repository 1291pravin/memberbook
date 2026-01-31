import { eq, desc } from "drizzle-orm";

export default cachedEventHandler(async (event) => {
  const access = event.context.access;
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
    .orderBy(desc(schema.payments.date));

  return { payments: paymentList };
}, {
  maxAge: 3600,
  getKey: (event) => orgCacheKey(event, "payments"),
});
