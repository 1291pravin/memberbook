import { eq, and, sql } from "drizzle-orm";

export default cachedEventHandler(async (event) => {
  const access = event.context.access;
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
      autoRenew: schema.memberSubscriptions.autoRenew,
      paymentStatus: schema.memberSubscriptions.paymentStatus,
      durationType: schema.subscriptionPlans.durationType,
      durationValue: schema.subscriptionPlans.durationValue,
    })
    .from(schema.memberSubscriptions)
    .innerJoin(schema.subscriptionPlans, eq(schema.memberSubscriptions.planId, schema.subscriptionPlans.id))
    .where(and(eq(schema.memberSubscriptions.memberId, memberId), eq(schema.memberSubscriptions.orgId, access.orgId)))
    .orderBy(schema.memberSubscriptions.startDate);

  // Get total paid per subscription
  const subPayments = await db
    .select({
      subscriptionId: schema.payments.subscriptionId,
      totalPaid: sql<number>`COALESCE(SUM(${schema.payments.amount}), 0)`,
    })
    .from(schema.payments)
    .where(and(eq(schema.payments.memberId, memberId), eq(schema.payments.orgId, access.orgId)))
    .groupBy(schema.payments.subscriptionId);

  const paidMap = new Map(subPayments.map(p => [p.subscriptionId, p.totalPaid]));

  const today = new Date().toISOString().split("T")[0];
  const subscriptionsWithPaid = subscriptions.map(s => ({
    ...s,
    status: s.status === "active" && s.endDate < today ? "expired" : s.status,
    totalPaid: paidMap.get(s.id) ?? 0,
  }));

  const paymentList = await db
    .select()
    .from(schema.payments)
    .where(and(eq(schema.payments.memberId, memberId), eq(schema.payments.orgId, access.orgId)))
    .orderBy(schema.payments.date);

  return { member: memberRows[0], subscriptions: subscriptionsWithPaid, payments: paymentList };
}, {
  maxAge: 3600,
  getKey: (event) => orgCacheKey(event, "members") + getRouterParam(event, "memberId"),
});
