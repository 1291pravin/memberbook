import { eq, and, gte, lte, desc, sql } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const access = event.context.access;
    const query = getQuery(event);

    const startDate =
      (query.startDate as string) ||
      monthStartIST();
    const endDate =
      (query.endDate as string) || todayIST();

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
});
