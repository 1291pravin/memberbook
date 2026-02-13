import { eq, and } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const access = event.context.access;
  requireOwner(access);

  const expenseId = parseInt(getRouterParam(event, "expenseId")!);

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

  // Hard delete
  await db.delete(schema.expenses).where(eq(schema.expenses.id, expenseId));

  await invalidateCache(access.orgId);

  return { success: true };
});
