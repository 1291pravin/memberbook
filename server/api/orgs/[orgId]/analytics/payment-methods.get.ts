import { eq, sql } from "drizzle-orm";

export default cachedEventHandler(async (event) => {
  const access = event.context.access;
  const orgId = access.orgId;

  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

  // Query payment methods breakdown for current month
  const results = await db.all<{ method: string; total: number; count: number }>(sql`
    SELECT method, SUM(amount) as total, COUNT(*) as count
    FROM payments
    WHERE org_id = ${orgId} AND STRFTIME('%Y-%m', date) = ${currentMonth}
    GROUP BY method
    ORDER BY total DESC
  `);

  return { data: results };
}, {
  maxAge: 600,
  getKey: (event) => orgCacheKey(event, "analytics-payment-methods"),
});
