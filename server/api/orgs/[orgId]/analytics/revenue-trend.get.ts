import { eq, and, gte, sql } from "drizzle-orm";

export default cachedEventHandler(async (event) => {
  const access = event.context.access;
  const orgId = access.orgId;
  const query = getQuery(event);
  const period = (query.period as string) || "daily";

  let daysBack = 30;
  let groupBy = "DATE(date)";
  let dateFormat = "DATE(date)";

  if (period === "weekly") {
    daysBack = 84; // 12 weeks
    // Group by week start (Monday)
    groupBy = "DATE(date, 'weekday 0', '-6 days')";
    dateFormat = groupBy;
  } else if (period === "monthly") {
    daysBack = 180; // 6 months
    groupBy = "STRFTIME('%Y-%m', date)";
    dateFormat = groupBy;
  }

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);
  const cutoffStr = cutoffDate.toISOString().split("T")[0];

  // Query revenue grouped by period
  const results = await db.all<{ date: string; revenue: number }>(sql`
    SELECT ${sql.raw(dateFormat)} as date, COALESCE(SUM(amount), 0) as revenue
    FROM payments
    WHERE org_id = ${orgId} AND date >= ${cutoffStr}
    GROUP BY ${sql.raw(groupBy)}
    ORDER BY date ASC
  `);

  return { data: results };
}, {
  maxAge: 600,
  getKey: (event) => {
    const query = getQuery(event);
    const period = (query.period as string) || "daily";
    return orgCacheKey(event, `analytics-revenue-${period}`);
  },
});
