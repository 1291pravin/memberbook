import { eq, and, sql } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const access = event.context.access;
  requireOwner(access);

  const categoryId = parseInt(getRouterParam(event, "categoryId")!);

  // Fetch the category
  const [category] = await db
    .select()
    .from(schema.expenseCategories)
    .where(
      and(
        eq(schema.expenseCategories.id, categoryId),
        eq(schema.expenseCategories.orgId, access.orgId)
      )
    )
    .limit(1);

  if (!category) {
    throw createError({ statusCode: 404, statusMessage: "Category not found" });
  }

  if (category.isSystem) {
    throw createError({
      statusCode: 403,
      statusMessage: "System categories cannot be deleted",
    });
  }

  // Check if category has expenses
  const [expenseCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.expenses)
    .where(eq(schema.expenses.categoryId, categoryId));

  if ((expenseCount?.count || 0) > 0) {
    throw createError({
      statusCode: 409,
      statusMessage: "Cannot delete category with existing expenses. Mark it as inactive instead.",
    });
  }

  // Soft delete by setting isActive to false
  await db
    .update(schema.expenseCategories)
    .set({ isActive: false })
    .where(eq(schema.expenseCategories.id, categoryId));

  await invalidateCache(access.orgId, "expenseCategories");

  return { success: true };
});
