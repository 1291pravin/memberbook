import { eq, sql, count } from "drizzle-orm";

export default cachedEventHandler(async (event) => {
  const access = event.context.access;

  // Get plans with active member count (members whose latest subscription is on this plan)
  const latestSub = db
    .select({
      memberId: schema.memberSubscriptions.memberId,
      maxId: sql<number>`MAX(${schema.memberSubscriptions.id})`.as("max_id"),
    })
    .from(schema.memberSubscriptions)
    .where(eq(schema.memberSubscriptions.orgId, access.orgId))
    .groupBy(schema.memberSubscriptions.memberId)
    .as("latest_sub");

  const memberCounts = await db
    .select({
      planId: schema.memberSubscriptions.planId,
      memberCount: count(schema.members.id),
    })
    .from(schema.members)
    .innerJoin(latestSub, eq(schema.members.id, latestSub.memberId))
    .innerJoin(schema.memberSubscriptions, eq(latestSub.maxId, schema.memberSubscriptions.id))
    .where(eq(schema.members.orgId, access.orgId))
    .groupBy(schema.memberSubscriptions.planId);

  const countMap = new Map(memberCounts.map((r) => [r.planId, r.memberCount]));

  const plans = await db
    .select()
    .from(schema.subscriptionPlans)
    .where(eq(schema.subscriptionPlans.orgId, access.orgId))
    .orderBy(schema.subscriptionPlans.name);

  const plansWithCount = plans.map((plan) => ({
    ...plan,
    memberCount: countMap.get(plan.id) ?? 0,
  }));

  return { plans: plansWithCount };
}, {
  maxAge: 3600,
  getKey: (event) => orgCacheKey(event, "plans"),
});
