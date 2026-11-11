import { eq, and, gte, sql } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const access = event.context.access;
    const query = getQuery(event);
    const period = (query.period as string) || "daily";

    let dateFormat: any;
    let startDate: string;

    if (period === "daily") {
      dateFormat = schema.expenses.date;
      startDate = dateIST(-30);
    } else if (period === "weekly") {
      dateFormat = sql<string>`DATE(${schema.expenses.date}, 'weekday 0', '-6 days')`;
      startDate = dateIST(-84);
    } else {
      // monthly
      dateFormat = sql<string>`SUBSTR(${schema.expenses.date}, 1, 7)`;
      startDate = dateIST(-180);
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
});
