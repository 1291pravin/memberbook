import { eq, and, between, gt, sql } from "drizzle-orm";

export default cachedEventHandler(async (event) => {
  const access = event.context.access;
  const orgId = access.orgId;

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

  // Expired
  const [expiredResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.memberSubscriptions)
    .where(
      and(
        eq(schema.memberSubscriptions.orgId, orgId),
        eq(schema.memberSubscriptions.status, "expired"),
      ),
    );

  return {
    active: activeResult.count,
    expiring: expiringResult.count,
    expired: expiredResult.count,
  };
}, {
  maxAge: 300, // 5 minutes - fresher data
  getKey: (event) => orgCacheKey(event, "analytics-subscription-status"),
});
