import { eq, and, gte, lte, desc, sql } from "drizzle-orm";

export default cachedEventHandler(async (event) => {
  const access = event.context.access;
    const query = getQuery(event);

    const now = new Date();
    const startDate =
      (query.startDate as string) ||
      new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const endDate =
      (query.endDate as string) || new Date().toISOString().split("T")[0];

    const data = await db
      .select({
        categoryId: schema.expenseCategories.id,
        categoryName: schema.expenseCategories.name,
        categoryColor: schema.expenseCategories.color,
        total: sql<number>`COALESCE(SUM(${schema.expenses.amount}), 0)`,
        count: sql<number>`COUNT(${schema.expenses.id})`,
      })
      .from(schema.expenseCategories)
      .leftJoin(
        schema.expenses,
        and(
          eq(schema.expenses.categoryId, schema.expenseCategories.id),
          gte(schema.expenses.date, startDate),
          lte(schema.expenses.date, endDate)
        )
      )
      .where(
        and(
          eq(schema.expenseCategories.orgId, access.orgId),
          eq(schema.expenseCategories.isActive, true)
        )
      )
      .groupBy(
        schema.expenseCategories.id,
        schema.expenseCategories.name,
        schema.expenseCategories.color
      )
      .having(sql`COUNT(${schema.expenses.id}) > 0`)
      .orderBy(desc(sql`SUM(${schema.expenses.amount})`));

  return { data };
}, {
  maxAge: 600,
  getKey: (event) => orgCacheKey(event, "analytics-expense-breakdown"),
});
