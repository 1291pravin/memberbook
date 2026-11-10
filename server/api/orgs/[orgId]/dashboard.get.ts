import { eq, and, sql, between, gte } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const access = event.context.access;
  const orgId = access.orgId;

  const today = new Date().toISOString().split("T")[0];
  const weekLater = new Date();
  weekLater.setDate(weekLater.getDate() + 7);
  const weekStr = weekLater.toISOString().split("T")[0];

  const monthStart = new Date();
  monthStart.setDate(1);
  const monthStr = monthStart.toISOString().split("T")[0];

  // All queries are independent, so run them concurrently: each D1 query is a
  // network round trip, and awaiting them one by one stacked up the latency.
  const [
    [activeResult],
    [expiringResult],
    [revenueResult],
    [expenseResult],
    pendingRows,
    recentPayments,
  ] = await Promise.all([
    // Active members count
    db
      .select({ count: sql<number>`count(*)` })
      .from(schema.members)
      .where(and(eq(schema.members.orgId, orgId), eq(schema.members.status, "active"))),

    // Expiring soon count (next 7 days, latest subscription per member only)
    db
      .select({ count: sql<number>`count(*)` })
      .from(schema.memberSubscriptions)
      .where(
        and(
          eq(schema.memberSubscriptions.orgId, orgId),
          eq(schema.memberSubscriptions.status, "active"),
          between(schema.memberSubscriptions.endDate, today, weekStr),
          sql`${schema.memberSubscriptions.id} = (
            SELECT MAX(ms2.id) FROM member_subscriptions ms2
            WHERE ms2.member_id = ${schema.memberSubscriptions.memberId}
              AND ms2.org_id = ${schema.memberSubscriptions.orgId}
          )`,
        ),
      ),

    // This month revenue
    db
      .select({ total: sql<number>`COALESCE(SUM(amount), 0)` })
      .from(schema.payments)
      .where(and(eq(schema.payments.orgId, orgId), gte(schema.payments.date, monthStr))),

    // This month expenses
    db
      .select({ total: sql<number>`COALESCE(SUM(amount), 0)` })
      .from(schema.expenses)
      .where(and(eq(schema.expenses.orgId, orgId), gte(schema.expenses.date, monthStr))),

    // Pending payments count (subscriptions with unpaid balance)
    db.all(sql`
      SELECT COUNT(*) as count FROM (
        SELECT ms.id,
          (ms.amount - COALESCE(SUM(p.amount), 0)) as pending
        FROM member_subscriptions ms
        LEFT JOIN payments p ON p.subscription_id = ms.id AND p.org_id = ms.org_id
        WHERE ms.org_id = ${orgId} AND ms.status = 'active'
        GROUP BY ms.id
        HAVING pending > 0
      )
    `),

    // Recent payments (last 5)
    db
      .select({
        id: schema.payments.id,
        amount: schema.payments.amount,
        date: schema.payments.date,
        memberName: schema.members.name,
      })
      .from(schema.payments)
      .innerJoin(schema.members, eq(schema.payments.memberId, schema.members.id))
      .where(eq(schema.payments.orgId, orgId))
      .orderBy(sql`${schema.payments.date} DESC`)
      .limit(5),
  ]);

  // Calculate profit
  const monthProfit = revenueResult.total - expenseResult.total;

  return {
    stats: {
      activeMembers: activeResult.count,
      expiringSoon: expiringResult.count,
      monthRevenue: revenueResult.total,
      monthExpenses: expenseResult.total,
      monthProfit: monthProfit,
      pendingPayments: (pendingRows[0] as { count: number })?.count || 0,
    },
    recentPayments,
  };
});
