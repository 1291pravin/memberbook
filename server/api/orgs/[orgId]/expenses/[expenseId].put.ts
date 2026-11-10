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

  const amountValue = amount === undefined ? undefined : Number(amount);
  if (amountValue !== undefined && (!Number.isFinite(amountValue) || amountValue <= 0)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Amount must be greater than zero",
    });
  }
  if (date !== undefined && date !== "" && !isIsoDate(date)) {
    throw createError({ statusCode: 400, statusMessage: "Date must be YYYY-MM-DD" });
  }
  if (paymentMethod && !isPaymentMethod(paymentMethod)) {
    throw createError({ statusCode: 400, statusMessage: "Invalid payment method" });
  }

  const result = await db
    .update(schema.expenses)
    .set({
      categoryId: categoryId || expense.categoryId,
      amount: amountValue !== undefined ? Math.round(amountValue) : expense.amount,
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


  return { expense: result[0] };
});
