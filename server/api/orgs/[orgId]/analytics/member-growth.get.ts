import { eq, and, gte, sql } from "drizzle-orm";

export default cachedEventHandler(async (event) => {
  const access = event.context.access;
  const orgId = access.orgId;

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 180); // Last 6 months
  const cutoffStr = cutoffDate.toISOString();

  // Query new members grouped by month
  const results = await db.all<{ month: string; count: number }>(sql`
    SELECT STRFTIME('%Y-%m', created_at) as month, COUNT(*) as count
    FROM members
    WHERE org_id = ${orgId} AND created_at >= ${cutoffStr}
    GROUP BY month
    ORDER BY month ASC
  `);

  return { data: results };
}, {
  maxAge: 600,
  getKey: (event) => orgCacheKey(event, "analytics-member-growth"),
});
