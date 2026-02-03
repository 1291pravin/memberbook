import { eq, and, sql } from "drizzle-orm";

export default cachedEventHandler(async (event) => {
  const access = event.context.access;
  const orgId = access.orgId;

  // Query plan popularity with active subscription counts
  const results = await db.all<{ planId: number; planName: string; activeCount: number }>(sql`
    SELECT
      sp.id as planId,
      sp.name as planName,
      COUNT(ms.id) as activeCount
    FROM subscription_plans sp
    LEFT JOIN member_subscriptions ms
      ON ms.plan_id = sp.id
      AND ms.status = 'active'
      AND ms.org_id = sp.org_id
    WHERE sp.org_id = ${orgId} AND sp.active = 1
    GROUP BY sp.id, sp.name
    ORDER BY activeCount DESC
  `);

  return { data: results };
}, {
  maxAge: 600,
  getKey: (event) => orgCacheKey(event, "analytics-plan-popularity"),
});
