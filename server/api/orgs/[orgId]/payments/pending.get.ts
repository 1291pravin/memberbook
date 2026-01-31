import { sql } from "drizzle-orm";

export default cachedEventHandler(async (event) => {
  const access = event.context.access;
  // Find active subscriptions where total payments < subscription amount
  const pending = await db.all(sql`
    SELECT
      ms.id as subscription_id,
      m.id as member_id,
      m.name as member_name,
      m.phone as member_phone,
      sp.name as plan_name,
      ms.amount as subscription_amount,
      ms.start_date,
      ms.end_date,
      COALESCE(SUM(p.amount), 0) as paid_amount,
      (ms.amount - COALESCE(SUM(p.amount), 0)) as pending_amount
    FROM member_subscriptions ms
    JOIN members m ON ms.member_id = m.id
    JOIN subscription_plans sp ON ms.plan_id = sp.id
    LEFT JOIN payments p ON p.subscription_id = ms.id AND p.org_id = ms.org_id
    WHERE ms.org_id = ${access.orgId}
      AND ms.status = 'active'
    GROUP BY ms.id
    HAVING pending_amount > 0
    ORDER BY ms.end_date ASC
  `);

  return { pending };
}, {
  maxAge: 300,
  getKey: (event) => orgCacheKey(event, "payments"),
});
