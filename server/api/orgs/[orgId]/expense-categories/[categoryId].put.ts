import { eq, and } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const access = event.context.access;
  requireOwner(access);

  const categoryId = parseInt(getRouterParam(event, "categoryId")!);
  const body = await readBody(event);
  const { name, description, color, isActive } = body;

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
      statusMessage: "System categories cannot be edited",
    });
  }

  // Check for duplicate name if name is changing
  if (name && name.trim() !== category.name) {
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
  }

  const result = await db
    .update(schema.expenseCategories)
    .set({
      name: name?.trim() || category.name,
      description: description !== undefined ? (description?.trim() || null) : category.description,
      color: color || category.color,
      isActive: isActive !== undefined ? isActive : category.isActive,
    })
    .where(eq(schema.expenseCategories.id, categoryId))
    .returning();

  await invalidateCache(access.orgId);

  return { category: result[0] };
});
