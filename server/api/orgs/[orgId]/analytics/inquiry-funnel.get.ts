import { eq, gte, sql } from "drizzle-orm";

export default cachedEventHandler(async (event) => {
  const access = event.context.access;
  const orgId = access.orgId;
  const query = getQuery(event);
  const days = Number.parseInt((query.days as string) || "90", 10);

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  const cutoffStr = cutoffDate.toISOString();

  // Query inquiry status breakdown
  const results = await db.all<{
    total: number;
    new: number;
    contacted: number;
    converted: number;
    lost: number;
  }>(sql`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as new,
      SUM(CASE WHEN status = 'contacted' THEN 1 ELSE 0 END) as contacted,
      SUM(CASE WHEN status = 'converted' THEN 1 ELSE 0 END) as converted,
      SUM(CASE WHEN status = 'lost' THEN 1 ELSE 0 END) as lost
    FROM inquiries
    WHERE org_id = ${orgId} AND created_at >= ${cutoffStr}
  `);

  const data = results[0] || { total: 0, new: 0, contacted: 0, converted: 0, lost: 0 };

  // Calculate conversion rate
  const totalResolved = data.converted + data.lost;
  const conversionRate = totalResolved > 0 ? Math.round((data.converted / totalResolved) * 100) : 0;

  return {
    ...data,
    conversionRate,
  };
}, {
  maxAge: 600,
  getKey: (event) => {
    const query = getQuery(event);
    const days = (query.days as string) || "90";
    return orgCacheKey(event, `analytics-inquiry-funnel-${days}`);
  },
});
