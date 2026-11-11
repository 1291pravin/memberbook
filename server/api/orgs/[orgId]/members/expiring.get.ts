import { eq, and, between, gte, lt, sql } from "drizzle-orm";

// Only consider the latest subscription per member (highest ID = most recent)
const latestSubFilter = sql`${schema.memberSubscriptions.id} = (
  SELECT MAX(ms2.id) FROM member_subscriptions ms2
  WHERE ms2.member_id = ${schema.memberSubscriptions.memberId}
    AND ms2.org_id = ${schema.memberSubscriptions.orgId}
)`;

export default defineEventHandler(async (event) => {
  const access = event.context.access;

  const today = todayIST();
  const weekStr = dateIST(7);

  // The grace period setting and the expiring list don't depend on each other,
  // so fetch them concurrently.
  const [[org], expiring] = await Promise.all([
    // Org's grace period
    db
      .select({ gracePeriodDays: schema.organizations.gracePeriodDays })
      .from(schema.organizations)
      .where(eq(schema.organizations.id, access.orgId))
      .limit(1),

    // Subscriptions expiring in next 7 days (latest per member only)
    db
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
      .orderBy(schema.memberSubscriptions.endDate),
  ]);

  const gracePeriodDays = org?.gracePeriodDays ?? 0;

  // Subscriptions in grace period (endDate passed but within grace window)
  let inGracePeriod: typeof expiring = [];
  if (gracePeriodDays > 0) {
    const graceCutoffStr = dateIST(-gracePeriodDays);

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
          // Strictly before today: plans ending today are already in the
          // "expiring" list above, and must not be listed (and messaged) twice.
          gte(schema.memberSubscriptions.endDate, graceCutoffStr),
          lt(schema.memberSubscriptions.endDate, today),
          latestSubFilter,
        ),
      )
      .orderBy(schema.memberSubscriptions.endDate);
  }

  return { expiring: [...inGracePeriod, ...expiring] };
});
