import { eq, and, between, sql } from "drizzle-orm";

// Only consider the latest subscription per member (highest ID = most recent)
const latestSubFilter = sql`${schema.memberSubscriptions.id} = (
  SELECT MAX(ms2.id) FROM member_subscriptions ms2
  WHERE ms2.member_id = ${schema.memberSubscriptions.memberId}
    AND ms2.org_id = ${schema.memberSubscriptions.orgId}
)`;

export default cachedEventHandler(async (event) => {
  const access = event.context.access;

  // Fetch org's grace period
  const [org] = await db
    .select({ gracePeriodDays: schema.organizations.gracePeriodDays })
    .from(schema.organizations)
    .where(eq(schema.organizations.id, access.orgId))
    .limit(1);

  const gracePeriodDays = org?.gracePeriodDays ?? 0;
  const today = new Date().toISOString().split("T")[0];
  const weekLater = new Date();
  weekLater.setDate(weekLater.getDate() + 7);
  const weekStr = weekLater.toISOString().split("T")[0];

  // Subscriptions expiring in next 7 days (latest per member only)
  const expiring = await db
    .select({
      memberId: schema.members.id,
      memberName: schema.members.name,
      memberPhone: schema.members.phone,
      planName: schema.subscriptionPlans.name,
      endDate: schema.memberSubscriptions.endDate,
      amount: schema.memberSubscriptions.amount,
      inGracePeriod: sql<boolean>`0`.as("in_grace_period"),
    })
    .from(schema.memberSubscriptions)
    .innerJoin(schema.members, eq(schema.memberSubscriptions.memberId, schema.members.id))
    .innerJoin(schema.subscriptionPlans, eq(schema.memberSubscriptions.planId, schema.subscriptionPlans.id))
    .where(
      and(
        eq(schema.memberSubscriptions.orgId, access.orgId),
        eq(schema.memberSubscriptions.status, "active"),
        between(schema.memberSubscriptions.endDate, today, weekStr),
        latestSubFilter,
      ),
    )
    .orderBy(schema.memberSubscriptions.endDate);

  // Subscriptions in grace period (endDate passed but within grace window)
  let inGracePeriod: typeof expiring = [];
  if (gracePeriodDays > 0) {
    const graceCutoff = new Date();
    graceCutoff.setDate(graceCutoff.getDate() - gracePeriodDays);
    const graceCutoffStr = graceCutoff.toISOString().split("T")[0];

    inGracePeriod = await db
      .select({
        memberId: schema.members.id,
        memberName: schema.members.name,
        memberPhone: schema.members.phone,
        planName: schema.subscriptionPlans.name,
        endDate: schema.memberSubscriptions.endDate,
        amount: schema.memberSubscriptions.amount,
        inGracePeriod: sql<boolean>`1`.as("in_grace_period"),
      })
      .from(schema.memberSubscriptions)
      .innerJoin(schema.members, eq(schema.memberSubscriptions.memberId, schema.members.id))
      .innerJoin(schema.subscriptionPlans, eq(schema.memberSubscriptions.planId, schema.subscriptionPlans.id))
      .where(
        and(
          eq(schema.memberSubscriptions.orgId, access.orgId),
          eq(schema.memberSubscriptions.status, "active"),
          between(schema.memberSubscriptions.endDate, graceCutoffStr, today),
          latestSubFilter,
        ),
      )
      .orderBy(schema.memberSubscriptions.endDate);
  }

  return { expiring: [...inGracePeriod, ...expiring] };
}, {
  maxAge: 300,
  getKey: (event) => orgCacheKey(event, "members-expiring"),
});
