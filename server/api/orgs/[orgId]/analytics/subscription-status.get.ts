import { eq, sql } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const access = event.context.access;
  const orgId = access.orgId;

  const today = todayIST();
  const weekStr = dateIST(7);

  const [org] = await db
    .select({ gracePeriodDays: schema.organizations.gracePeriodDays })
    .from(schema.organizations)
    .where(eq(schema.organizations.id, orgId))
    .limit(1);

  const gracePeriodDays = org?.gracePeriodDays ?? 0;
  // With no grace period the cutoff is today, so the grace bucket is empty.
  const graceCutoffStr = gracePeriodDays > 0 ? dateIST(-gracePeriodDays) : today;

  // Count each member once, by their latest subscription. Counting every
  // subscription row put members who renewed in both "active" and "expired".
  // The buckets are exclusive and cover every date (grace is
  // [graceCutoff, today), expired is before graceCutoff).
  const [counts] = await db.all<{
    active: number | null;
    expiring: number | null;
    grace: number | null;
    expired: number | null;
  }>(sql`
    SELECT
      SUM(CASE WHEN ms.status = 'active' AND ms.end_date > ${weekStr} THEN 1 ELSE 0 END) AS active,
      SUM(CASE WHEN ms.status = 'active' AND ms.end_date >= ${today} AND ms.end_date <= ${weekStr} THEN 1 ELSE 0 END) AS expiring,
      SUM(CASE WHEN ms.status = 'active' AND ms.end_date < ${today} AND ms.end_date >= ${graceCutoffStr} THEN 1 ELSE 0 END) AS grace,
      SUM(CASE WHEN ms.status = 'expired' OR (ms.status = 'active' AND ms.end_date < ${graceCutoffStr}) THEN 1 ELSE 0 END) AS expired
    FROM member_subscriptions ms
    WHERE ms.org_id = ${orgId}
      AND ms.id = (
        SELECT MAX(ms2.id) FROM member_subscriptions ms2
        WHERE ms2.member_id = ms.member_id AND ms2.org_id = ms.org_id
      )
  `);

  const graceCount = Number(counts?.grace ?? 0);

  return {
    active: Number(counts?.active ?? 0) + graceCount,
    expiring: Number(counts?.expiring ?? 0),
    gracePeriod: graceCount,
    expired: Number(counts?.expired ?? 0),
  };
});
