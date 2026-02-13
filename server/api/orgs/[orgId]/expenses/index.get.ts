import { eq, and, or, like, gte, lte, desc, sql } from "drizzle-orm";

export default cachedEventHandler(async (event) => {
  const access = event.context.access;
  const query = getQuery(event);

  const page = parseInt(query.page as string) || 1;
  const limit = 30;
  const offset = (page - 1) * limit;

  const categoryId = query.categoryId ? parseInt(query.categoryId as string) : undefined;
  const startDate = query.startDate as string | undefined;
  const endDate = query.endDate as string | undefined;
  const search = query.search as string | undefined;

  // Build WHERE conditions
  const conditions = [eq(schema.expenses.orgId, access.orgId)];

  if (categoryId) {
    conditions.push(eq(schema.expenses.categoryId, categoryId));
  }

  if (startDate) {
    conditions.push(gte(schema.expenses.date, startDate));
  }

  if (endDate) {
    conditions.push(lte(schema.expenses.date, endDate));
  }

  if (search && search.trim()) {
    conditions.push(
      or(
        like(schema.expenses.description, `%${search.trim()}%`),
        like(schema.expenses.vendorName, `%${search.trim()}%`)
      )!
    );
  }

  // Get total count
  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.expenses)
    .where(and(...conditions));

  const total = countResult?.count || 0;
  const totalPages = Math.ceil(total / limit);

  // Get expenses with category info
  const expenses = await db
    .select({
      id: schema.expenses.id,
      amount: schema.expenses.amount,
      date: schema.expenses.date,
      paymentMethod: schema.expenses.paymentMethod,
      vendorName: schema.expenses.vendorName,
      description: schema.expenses.description,
      notes: schema.expenses.notes,
      categoryId: schema.expenses.categoryId,
      categoryName: schema.expenseCategories.name,
      categoryColor: schema.expenseCategories.color,
      createdAt: schema.expenses.createdAt,
    })
    .from(schema.expenses)
    .innerJoin(
      schema.expenseCategories,
      eq(schema.expenses.categoryId, schema.expenseCategories.id)
    )
    .where(and(...conditions))
    .orderBy(desc(schema.expenses.date), desc(schema.expenses.id))
    .limit(limit)
    .offset(offset);

  return {
    expenses,
    pagination: {
      page,
      totalPages,
      total,
    },
  };
}, {
  maxAge: 600,
  getKey: (event) => orgCacheKey(event, "expenses"),
});
