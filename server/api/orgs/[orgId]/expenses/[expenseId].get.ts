import { eq, and } from "drizzle-orm";

export default cachedEventHandler(async (event) => {
  const access = event.context.access;
    const expenseId = parseInt(getRouterParam(event, "expenseId")!);

    const [expense] = await db
      .select({
        id: schema.expenses.id,
        amount: schema.expenses.amount,
        date: schema.expenses.date,
        paymentMethod: schema.expenses.paymentMethod,
        vendorName: schema.expenses.vendorName,
        description: schema.expenses.description,
        notes: schema.expenses.notes,
        isRecurring: schema.expenses.isRecurring,
        recurringFrequency: schema.expenses.recurringFrequency,
        categoryId: schema.expenses.categoryId,
        categoryName: schema.expenseCategories.name,
        categoryColor: schema.expenseCategories.color,
        createdBy: schema.expenses.createdBy,
        createdByName: schema.users.name,
        createdAt: schema.expenses.createdAt,
      })
      .from(schema.expenses)
      .innerJoin(
        schema.expenseCategories,
        eq(schema.expenses.categoryId, schema.expenseCategories.id)
      )
      .innerJoin(schema.users, eq(schema.expenses.createdBy, schema.users.id))
      .where(
        and(
          eq(schema.expenses.id, expenseId),
          eq(schema.expenses.orgId, access.orgId)
        )
      )
      .limit(1);

    if (!expense) {
      throw createError({ statusCode: 404, statusMessage: "Expense not found" });
    }

  return { expense };
}, {
  maxAge: 600,
  getKey: (event) => orgCacheKey(event, `expense-${getRouterParam(event, "expenseId")}`),
});
