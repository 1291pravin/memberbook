import { eq, and, gte, sql } from "drizzle-orm";

export default cachedEventHandler(async (event) => {
  const access = event.context.access;
    const query = getQuery(event);
    const period = (query.period as string) || "daily";

    let dateFormat: any;
    let startDate: string;
    const now = new Date();

    if (period === "daily") {
      dateFormat = "date";
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      startDate = thirtyDaysAgo.toISOString().split("T")[0];
    } else if (period === "weekly") {
      dateFormat = sql<string>`DATE(date, 'weekday 0', '-6 days')`;
      const eightyFourDaysAgo = new Date(now);
      eightyFourDaysAgo.setDate(eightyFourDaysAgo.getDate() - 84);
      startDate = eightyFourDaysAgo.toISOString().split("T")[0];
    } else {
      // monthly
      dateFormat = sql<string>`SUBSTR(date, 1, 7)`;
      const oneEightyDaysAgo = new Date(now);
      oneEightyDaysAgo.setDate(oneEightyDaysAgo.getDate() - 180);
      startDate = oneEightyDaysAgo.toISOString().split("T")[0];
    }

    // Get revenue data
    const revenueData = await db
      .select({
        date: period === "daily" ? schema.payments.date : dateFormat,
        revenue: sql<number>`COALESCE(SUM(${schema.payments.amount}), 0)`,
      })
      .from(schema.payments)
      .where(
        and(
          eq(schema.payments.orgId, access.orgId),
          gte(schema.payments.date, startDate)
        )
      )
      .groupBy(period === "daily" ? schema.payments.date : dateFormat);

    // Get expense data
    const expenseData = await db
      .select({
        date: period === "daily" ? schema.expenses.date : dateFormat,
        expenses: sql<number>`COALESCE(SUM(${schema.expenses.amount}), 0)`,
      })
      .from(schema.expenses)
      .where(
        and(
          eq(schema.expenses.orgId, access.orgId),
          gte(schema.expenses.date, startDate)
        )
      )
      .groupBy(period === "daily" ? schema.expenses.date : dateFormat);

    // Combine revenue and expense data
    const revenueMap = new Map(revenueData.map((r) => [r.date, r.revenue]));
    const expenseMap = new Map(expenseData.map((e) => [e.date, e.expenses]));

    // Get all unique dates
    const allDates = new Set([...revenueMap.keys(), ...expenseMap.keys()]);

    const data = Array.from(allDates)
      .map((date) => {
        const revenue = revenueMap.get(date) || 0;
        const expenses = expenseMap.get(date) || 0;
        return {
          date,
          revenue,
          expenses,
          profit: revenue - expenses,
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date));

  return { data };
}, {
  maxAge: 600,
  getKey: (event) => orgCacheKey(event, "analytics-profit"),
});
