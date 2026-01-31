import { eq, and } from "drizzle-orm";

export default cachedEventHandler(async (event) => {
  const access = await requireOrgAccess(event);
  const memberId = Number(getRouterParam(event, "memberId"));

  const memberRows = await db
    .select()
    .from(schema.members)
    .where(and(eq(schema.members.id, memberId), eq(schema.members.orgId, access.orgId)))
    .limit(1);

  if (!memberRows[0]) {
    throw createError({ statusCode: 404, statusMessage: "Member not found" });
  }

  const subscriptions = await db
    .select({
      id: schema.memberSubscriptions.id,
      planId: schema.memberSubscriptions.planId,
      planName: schema.subscriptionPlans.name,
      startDate: schema.memberSubscriptions.startDate,
      endDate: schema.memberSubscriptions.endDate,
      amount: schema.memberSubscriptions.amount,
      status: schema.memberSubscriptions.status,
    })
    .from(schema.memberSubscriptions)
    .innerJoin(schema.subscriptionPlans, eq(schema.memberSubscriptions.planId, schema.subscriptionPlans.id))
    .where(and(eq(schema.memberSubscriptions.memberId, memberId), eq(schema.memberSubscriptions.orgId, access.orgId)))
    .orderBy(schema.memberSubscriptions.startDate);

  const paymentList = await db
    .select()
    .from(schema.payments)
    .where(and(eq(schema.payments.memberId, memberId), eq(schema.payments.orgId, access.orgId)))
    .orderBy(schema.payments.date);

  return { member: memberRows[0], subscriptions, payments: paymentList };
}, {
  maxAge: 3600,
  getKey: (event) => orgCacheKey(event, "members") + getRouterParam(event, "memberId"),
});
