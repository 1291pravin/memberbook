import { eq } from "drizzle-orm";

export default cachedEventHandler(async (event) => {
  const access = event.context.access;

  const categories = await db
    .select({
      id: schema.expenseCategories.id,
      name: schema.expenseCategories.name,
      description: schema.expenseCategories.description,
      color: schema.expenseCategories.color,
      isActive: schema.expenseCategories.isActive,
      isSystem: schema.expenseCategories.isSystem,
      displayOrder: schema.expenseCategories.displayOrder,
    })
    .from(schema.expenseCategories)
    .where(eq(schema.expenseCategories.orgId, access.orgId))
    .orderBy(schema.expenseCategories.displayOrder, schema.expenseCategories.name);

  return { categories };
}, {
  maxAge: 600,
  getKey: (event) => orgCacheKey(event, "expense-categories"),
});
