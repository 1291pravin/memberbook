import { sql } from "drizzle-orm";

type CountRow = {
  date: string;
  value: number;
};

function numberValue(value: unknown) {
  return Number(value ?? 0);
}

function mergeDailySeries(series: Record<string, CountRow[]>) {
  const dates = new Set<string>();
  for (const rows of Object.values(series)) {
    for (const row of rows) {
      dates.add(row.date);
    }
  }

  return Array.from(dates).sort().map((date) => {
    const item: Record<string, number | string> = { date };
    for (const [key, rows] of Object.entries(series)) {
      item[key] = numberValue(rows.find((row) => row.date === date)?.value);
    }
    return item;
  });
}

export default defineEventHandler(async (event) => {
  await requireAdminAccess(event);

  const query = getQuery(event);
  const days = readPositiveInteger(query.days, 28, 365);
  const sinceDate = typeof query.since === "string" && /^\d{4}-\d{2}-\d{2}$/.test(query.since)
    ? query.since
    : daysAgoDate(days);

  const testOrgPredicate = sql`
    (
      demo_data_ids IS NOT NULL
      OR lower(name) LIKE '%test%'
      OR lower(name) LIKE '%demo%'
      OR lower(name) LIKE '%sample%'
    )
  `;
  const orgTestPredicate = sql`
    (
      o.demo_data_ids IS NOT NULL
      OR lower(o.name) LIKE '%test%'
      OR lower(o.name) LIKE '%demo%'
      OR lower(o.name) LIKE '%sample%'
    )
  `;

  const [totals] = await db.all(sql`
    SELECT
      (SELECT COUNT(*) FROM users) AS users_total,
      (SELECT COUNT(*) FROM organizations) AS orgs_total,
      (SELECT COUNT(*) FROM organizations WHERE NOT ${testOrgPredicate}) AS real_orgs_total,
      (SELECT COUNT(*) FROM members) AS members_total,
      (SELECT COUNT(*) FROM subscription_plans) AS plans_total,
      (SELECT COUNT(*) FROM payments) AS payments_total,
      (SELECT COALESCE(SUM(amount), 0) FROM payments) AS payment_volume_total,
      (SELECT COUNT(*) FROM check_ins) AS checkins_total,
      (SELECT COUNT(*) FROM inquiries) AS inquiries_total,
      (SELECT COUNT(*) FROM contact_submissions) AS contact_submissions_total
  `) as Array<Record<string, unknown>>;

  const [period] = await db.all(sql`
    SELECT
      (SELECT COUNT(*) FROM users WHERE created_at >= ${sinceDate}) AS users_new,
      (SELECT COUNT(*) FROM organizations WHERE created_at >= ${sinceDate}) AS orgs_new,
      (SELECT COUNT(*) FROM organizations WHERE created_at >= ${sinceDate} AND NOT ${testOrgPredicate}) AS real_orgs_new,
      (SELECT COUNT(*) FROM members WHERE created_at >= ${sinceDate}) AS members_added,
      (SELECT COUNT(*) FROM subscription_plans WHERE created_at >= ${sinceDate}) AS plans_created,
      (SELECT COUNT(*) FROM payments WHERE created_at >= ${sinceDate}) AS payments_recorded,
      (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE created_at >= ${sinceDate}) AS payment_volume,
      (SELECT COUNT(*) FROM check_ins WHERE checked_in_at >= ${sinceDate}) AS checkins,
      (SELECT COUNT(*) FROM inquiries WHERE created_at >= ${sinceDate}) AS inquiries_created,
      (SELECT COUNT(*) FROM contact_submissions WHERE created_at >= ${sinceDate}) AS contact_submissions
  `) as Array<Record<string, unknown>>;

  const orgActivitySql = sql`
    SELECT
      o.id,
      o.name,
      o.slug,
      o.type,
      o.created_at AS created_at,
      CASE WHEN ${orgTestPredicate} THEN 1 ELSE 0 END AS is_test_or_demo,
      owner.id AS owner_id,
      owner.name AS owner_name,
      owner.email AS owner_email,
      COALESCE(member_counts.count, 0) AS members,
      COALESCE(plan_counts.count, 0) AS plans,
      COALESCE(payment_counts.count, 0) AS payments,
      COALESCE(payment_counts.volume, 0) AS payment_volume,
      COALESCE(checkin_counts.count, 0) AS checkins,
      COALESCE(inquiry_counts.count, 0) AS inquiries,
      MAX(
        o.created_at,
        COALESCE(member_counts.last_at, ''),
        COALESCE(plan_counts.last_at, ''),
        COALESCE(payment_counts.last_at, ''),
        COALESCE(checkin_counts.last_at, ''),
        COALESCE(inquiry_counts.last_at, '')
      ) AS last_activity_at
    FROM organizations o
    LEFT JOIN org_memberships owner_membership
      ON owner_membership.org_id = o.id AND owner_membership.role = 'owner'
    LEFT JOIN users owner ON owner.id = owner_membership.user_id
    LEFT JOIN (
      SELECT org_id, COUNT(*) AS count, MAX(created_at) AS last_at
      FROM members
      GROUP BY org_id
    ) member_counts ON member_counts.org_id = o.id
    LEFT JOIN (
      SELECT org_id, COUNT(*) AS count, MAX(created_at) AS last_at
      FROM subscription_plans
      GROUP BY org_id
    ) plan_counts ON plan_counts.org_id = o.id
    LEFT JOIN (
      SELECT org_id, COUNT(*) AS count, COALESCE(SUM(amount), 0) AS volume, MAX(created_at) AS last_at
      FROM payments
      GROUP BY org_id
    ) payment_counts ON payment_counts.org_id = o.id
    LEFT JOIN (
      SELECT org_id, COUNT(*) AS count, MAX(checked_in_at) AS last_at
      FROM check_ins
      GROUP BY org_id
    ) checkin_counts ON checkin_counts.org_id = o.id
    LEFT JOIN (
      SELECT org_id, COUNT(*) AS count, MAX(created_at) AS last_at
      FROM inquiries
      GROUP BY org_id
    ) inquiry_counts ON inquiry_counts.org_id = o.id
  `;

  const recentSignups = await db.all(sql`
    ${orgActivitySql}
    WHERE o.created_at >= ${sinceDate}
    ORDER BY o.created_at DESC
    LIMIT 25
  `);

  const activeOrganizations = await db.all(sql`
    SELECT * FROM (${orgActivitySql}) AS org_activity
    WHERE is_test_or_demo = 0
      AND (members > 0 OR plans > 0 OR payments > 0 OR checkins > 0 OR inquiries > 0)
    ORDER BY
      (members + plans + (payments * 2) + (checkins * 0.25) + inquiries) DESC,
      last_activity_at DESC
    LIMIT 25
  `);

  const [
    usersDaily,
    orgsDaily,
    membersDaily,
    plansDaily,
    paymentsDaily,
    checkinsDaily,
    inquiriesDaily,
  ] = await Promise.all([
    db.all(sql`SELECT date(created_at) AS date, COUNT(*) AS value FROM users WHERE created_at >= ${sinceDate} GROUP BY date(created_at)`),
    db.all(sql`SELECT date(created_at) AS date, COUNT(*) AS value FROM organizations WHERE created_at >= ${sinceDate} GROUP BY date(created_at)`),
    db.all(sql`SELECT date(created_at) AS date, COUNT(*) AS value FROM members WHERE created_at >= ${sinceDate} GROUP BY date(created_at)`),
    db.all(sql`SELECT date(created_at) AS date, COUNT(*) AS value FROM subscription_plans WHERE created_at >= ${sinceDate} GROUP BY date(created_at)`),
    db.all(sql`SELECT date(created_at) AS date, COUNT(*) AS value FROM payments WHERE created_at >= ${sinceDate} GROUP BY date(created_at)`),
    db.all(sql`SELECT date(checked_in_at) AS date, COUNT(*) AS value FROM check_ins WHERE checked_in_at >= ${sinceDate} GROUP BY date(checked_in_at)`),
    db.all(sql`SELECT date(created_at) AS date, COUNT(*) AS value FROM inquiries WHERE created_at >= ${sinceDate} GROUP BY date(created_at)`),
  ]) as CountRow[][];

  await recordAdminAuditLog(event, "usage_report_view", { metadata: { days, sinceDate } });

  return {
    period: {
      days,
      sinceDate,
    },
    totals,
    periodTotals: period,
    daily: mergeDailySeries({
      users: usersDaily,
      organizations: orgsDaily,
      members: membersDaily,
      plans: plansDaily,
      payments: paymentsDaily,
      checkIns: checkinsDaily,
      inquiries: inquiriesDaily,
    }),
    recentSignups,
    activeOrganizations,
  };
});
