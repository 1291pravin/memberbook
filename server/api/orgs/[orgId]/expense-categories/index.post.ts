import { eq, and, sql } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const access = event.context.access;
  requireOwner(access);

  const body = await readBody(event);
  const { name, description, color } = body;

  if (!name || !name.trim()) {
    throw createError({ statusCode: 400, statusMessage: "Category name is required" });
  }

  // Check for duplicate category name
  const existing = await db
    .select()
    .from(schema.expenseCategories)
    .where(
      and(
        eq(schema.expenseCategories.orgId, access.orgId),
        eq(schema.expenseCategories.name, name.trim())
      )
    )
    .limit(1);

  if (existing.length > 0) {
    throw createError({
      statusCode: 409,
      statusMessage: "A category with this name already exists",
    });
  }

  // Get max display order
  const maxOrderResult = await db
    .select({ maxOrder: sql<number>`COALESCE(MAX(${schema.expenseCategories.displayOrder}), 0)` })
    .from(schema.expenseCategories)
    .where(eq(schema.expenseCategories.orgId, access.orgId));

  const displayOrder = (maxOrderResult[0]?.maxOrder || 0) + 1;

  const result = await db
    .insert(schema.expenseCategories)
    .values({
      orgId: access.orgId,
      name: name.trim(),
      description: description?.trim() || null,
      color: color || "slate",
      isSystem: false,
      isActive: true,
      displayOrder,
    })
    .returning();

  await invalidateCache(access.orgId, "expenseCategories");

  return { category: result[0] };
});
