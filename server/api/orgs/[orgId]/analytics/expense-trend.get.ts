import { eq, and, gte, sql } from "drizzle-orm";

export default cachedEventHandler(async (event) => {
  const access = event.context.access;
    const query = getQuery(event);
    const period = (query.period as string) || "daily";

    let dateFormat: any;
    let startDate: string;
    const now = new Date();

    if (period === "daily") {
      dateFormat = schema.expenses.date;
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      startDate = thirtyDaysAgo.toISOString().split("T")[0];
    } else if (period === "weekly") {
      dateFormat = sql<string>`DATE(${schema.expenses.date}, 'weekday 0', '-6 days')`;
      const eightyFourDaysAgo = new Date(now);
      eightyFourDaysAgo.setDate(eightyFourDaysAgo.getDate() - 84);
      startDate = eightyFourDaysAgo.toISOString().split("T")[0];
    } else {
      // monthly
      dateFormat = sql<string>`SUBSTR(${schema.expenses.date}, 1, 7)`;
      const oneEightyDaysAgo = new Date(now);
      oneEightyDaysAgo.setDate(oneEightyDaysAgo.getDate() - 180);
      startDate = oneEightyDaysAgo.toISOString().split("T")[0];
    }

    const data = await db
      .select({
        date: dateFormat,
        expenses: sql<number>`COALESCE(SUM(${schema.expenses.amount}), 0)`,
      })
      .from(schema.expenses)
      .where(
        and(
          eq(schema.expenses.orgId, access.orgId),
          gte(schema.expenses.date, startDate)
        )
      )
      .groupBy(dateFormat)
      .orderBy(dateFormat);

  return { data };
}, {
  maxAge: 600,
  getKey: (event) => orgCacheKey(event, "analytics-expense-trend"),
});
