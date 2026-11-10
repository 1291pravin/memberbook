import { eq, and, between, gt, sql, lt } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const access = event.context.access;
  const orgId = access.orgId;

  const today = new Date().toISOString().split("T")[0];
  const weekLater = new Date();
  weekLater.setDate(weekLater.getDate() + 7);
  const weekStr = weekLater.toISOString().split("T")[0];

  // First batch: grace period setting plus the two counts that don't depend on it.
  const [[org], [activeResult], [expiringResult]] = await Promise.all([
    db
      .select({ gracePeriodDays: schema.organizations.gracePeriodDays })
      .from(schema.organizations)
      .where(eq(schema.organizations.id, orgId))
      .limit(1),

    // Active (not expiring in next 7 days)
    db
      .select({ count: sql<number>`count(*)` })
      .from(schema.memberSubscriptions)
      .where(
        and(
          eq(schema.memberSubscriptions.orgId, orgId),
          eq(schema.memberSubscriptions.status, "active"),
          gt(schema.memberSubscriptions.endDate, weekStr),
        ),
      ),

    // Expiring soon (next 7 days)
    db
      .select({ count: sql<number>`count(*)` })
      .from(schema.memberSubscriptions)
      .where(
        and(
          eq(schema.memberSubscriptions.orgId, orgId),
          eq(schema.memberSubscriptions.status, "active"),
          between(schema.memberSubscriptions.endDate, today, weekStr),
        ),
      ),
  ]);

  const gracePeriodDays = org?.gracePeriodDays ?? 0;
  const graceCutoffStr = gracePeriodDays > 0
    ? (() => { const d = new Date(); d.setDate(d.getDate() - gracePeriodDays); return d.toISOString().split("T")[0]; })()
    : today;

  // Second batch: counts that depend on the grace period, run concurrently.
  const [graceRows, [expiredResult]] = await Promise.all([
    // Grace period: endDate passed but within grace window, still status=active
    gracePeriodDays > 0
      ? db
          .select({ count: sql<number>`count(*)` })
          .from(schema.memberSubscriptions)
          .where(
            and(
              eq(schema.memberSubscriptions.orgId, orgId),
              eq(schema.memberSubscriptions.status, "active"),
              lt(schema.memberSubscriptions.endDate, today),
              gt(schema.memberSubscriptions.endDate, graceCutoffStr),
            ),
          )
      : Promise.resolve([]),

    // Expired: DB status is 'expired' OR endDate has passed (status still 'active' in DB)
    db
      .select({ count: sql<number>`count(*)` })
      .from(schema.memberSubscriptions)
      .where(
        and(
          eq(schema.memberSubscriptions.orgId, orgId),
          sql`(${schema.memberSubscriptions.status} = 'expired' OR (${schema.memberSubscriptions.status} = 'active' AND ${schema.memberSubscriptions.endDate} < ${graceCutoffStr}))`,
        ),
      ),
  ]);
  const graceCount = graceRows[0]?.count ?? 0;

  return {
    active: activeResult.count + graceCount,
    expiring: expiringResult.count,
    gracePeriod: graceCount,
    expired: expiredResult.count,
  };
});
