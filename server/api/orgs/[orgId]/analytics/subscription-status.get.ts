import { eq, and, between, gt, sql, lt } from "drizzle-orm";

export default cachedEventHandler(async (event) => {
  const access = event.context.access;
  const orgId = access.orgId;

  // Fetch org's grace period
  const [org] = await db
    .select({ gracePeriodDays: schema.organizations.gracePeriodDays })
    .from(schema.organizations)
    .where(eq(schema.organizations.id, orgId))
    .limit(1);

  const gracePeriodDays = org?.gracePeriodDays ?? 0;
  const today = new Date().toISOString().split("T")[0];
  const weekLater = new Date();
  weekLater.setDate(weekLater.getDate() + 7);
  const weekStr = weekLater.toISOString().split("T")[0];

  // Active (not expiring in next 7 days)
  const [activeResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.memberSubscriptions)
    .where(
      and(
        eq(schema.memberSubscriptions.orgId, orgId),
        eq(schema.memberSubscriptions.status, "active"),
        gt(schema.memberSubscriptions.endDate, weekStr),
      ),
    );

  // Expiring soon (next 7 days)
  const [expiringResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.memberSubscriptions)
    .where(
      and(
        eq(schema.memberSubscriptions.orgId, orgId),
        eq(schema.memberSubscriptions.status, "active"),
        between(schema.memberSubscriptions.endDate, today, weekStr),
      ),
    );

  // Grace period: endDate passed but within grace window, still status=active
  let graceCount = 0;
  if (gracePeriodDays > 0) {
    const graceCutoff = new Date();
    graceCutoff.setDate(graceCutoff.getDate() - gracePeriodDays);
    const graceCutoffStr = graceCutoff.toISOString().split("T")[0];

    const [graceResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.memberSubscriptions)
      .where(
        and(
          eq(schema.memberSubscriptions.orgId, orgId),
          eq(schema.memberSubscriptions.status, "active"),
          lt(schema.memberSubscriptions.endDate, today),
          gt(schema.memberSubscriptions.endDate, graceCutoffStr),
        ),
      );
    graceCount = graceResult.count;
  }

  // Expired: DB status is 'expired' OR endDate has passed (status still 'active' in DB)
  const graceCutoffForExpired = gracePeriodDays > 0
    ? (() => { const d = new Date(); d.setDate(d.getDate() - gracePeriodDays); return d.toISOString().split("T")[0]; })()
    : today;
  const [expiredResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.memberSubscriptions)
    .where(
      and(
        eq(schema.memberSubscriptions.orgId, orgId),
        sql`(${schema.memberSubscriptions.status} = 'expired' OR (${schema.memberSubscriptions.status} = 'active' AND ${schema.memberSubscriptions.endDate} < ${graceCutoffForExpired}))`,
      ),
    );

  return {
    active: activeResult.count + graceCount,
    expiring: expiringResult.count,
    gracePeriod: graceCount,
    expired: expiredResult.count,
  };
}, {
  maxAge: 300,
  getKey: (event) => orgCacheKey(event, "analytics-subscription-status"),
});
