import { eq, and } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const access = event.context.access;
  const body = await readBody(event);

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

  // Validate required fields
  if (!categoryId || !amount || !date || !description) {
    throw createError({
      statusCode: 400,
      statusMessage: "Category, amount, date, and description are required",
    });
  }

  if (amount <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Amount must be greater than zero",
    });
  }

  // Validate category exists and belongs to org
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

  const result = await db
    .insert(schema.expenses)
    .values({
      orgId: access.orgId,
      categoryId,
      amount: Math.round(amount), // Ensure integer (paise)
      date,
      description: description.trim(),
      paymentMethod: paymentMethod || "cash",
      vendorName: vendorName?.trim() || null,
      notes: notes?.trim() || null,
      isRecurring: isRecurring || false,
      recurringFrequency: recurringFrequency || null,
      createdBy: access.userId,
    })
    .returning();

  await invalidateCache(access.orgId, "expenses");

  return { expense: result[0] };
});
