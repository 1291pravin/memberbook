import { eq, and } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const access = event.context.access;
  const expenseId = parseInt(getRouterParam(event, "expenseId")!);
  const body = await readBody(event);

  // Fetch the expense
  const [expense] = await db
    .select()
    .from(schema.expenses)
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

  const {
    categoryId,
    amount,
    date,
    description,
    paymentMethod,
    vendorName,
    notes,
    isRecurring,
    recurringFrequency,
  } = body;

  // Validate category if provided
  if (categoryId) {
    const [category] = await db
      .select()
      .from(schema.expenseCategories)
      .where(
        and(
          eq(schema.expenseCategories.id, categoryId),
          eq(schema.expenseCategories.orgId, access.orgId),
          eq(schema.expenseCategories.isActive, true)
        )
      )
      .limit(1);

    if (!category) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid category",
      });
    }
  }

  if (amount !== undefined && amount <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Amount must be greater than zero",
    });
  }

  const result = await db
    .update(schema.expenses)
    .set({
      categoryId: categoryId || expense.categoryId,
      amount: amount !== undefined ? Math.round(amount) : expense.amount,
      date: date || expense.date,
      description: description?.trim() || expense.description,
      paymentMethod: paymentMethod || expense.paymentMethod,
      vendorName: vendorName !== undefined ? (vendorName?.trim() || null) : expense.vendorName,
      notes: notes !== undefined ? (notes?.trim() || null) : expense.notes,
      isRecurring: isRecurring !== undefined ? isRecurring : expense.isRecurring,
      recurringFrequency:
        recurringFrequency !== undefined ? recurringFrequency : expense.recurringFrequency,
    })
    .where(eq(schema.expenses.id, expenseId))
    .returning();

  await invalidateCache(access.orgId, "expenses");

  return { expense: result[0] };
});
