import { eq, and, gte, lte, desc } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const access = event.context.access;
  const query = getQuery(event);

  const categoryId = query.categoryId ? parseInt(query.categoryId as string) : undefined;
  const startDate = query.startDate as string | undefined;
  const endDate = query.endDate as string | undefined;

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

  // Get expenses (limit to 10,000 rows for safety)
  const expenses = await db
    .select({
      date: schema.expenses.date,
      category: schema.expenseCategories.name,
      description: schema.expenses.description,
      vendorName: schema.expenses.vendorName,
      amount: schema.expenses.amount,
      paymentMethod: schema.expenses.paymentMethod,
      notes: schema.expenses.notes,
      createdBy: schema.users.name,
    })
    .from(schema.expenses)
    .innerJoin(
      schema.expenseCategories,
      eq(schema.expenses.categoryId, schema.expenseCategories.id)
    )
    .innerJoin(schema.users, eq(schema.expenses.createdBy, schema.users.id))
    .where(and(...conditions))
    .orderBy(desc(schema.expenses.date))
    .limit(10000);

  // Build CSV
  const headers = [
    "Date",
    "Category",
    "Description",
    "Vendor/Supplier",
    "Amount (₹)",
    "Payment Method",
    "Notes",
    "Created By",
  ];

  const rows = expenses.map((exp) => [
    exp.date,
    exp.category,
    exp.description,
    exp.vendorName || "",
    (exp.amount / 100).toFixed(2), // Convert paise to rupees
    exp.paymentMethod,
    exp.notes || "",
    exp.createdBy,
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  // Set headers for CSV download
  setResponseHeaders(event, {
    "Content-Type": "text/csv",
    "Content-Disposition": `attachment; filename="expenses-${new Date().toISOString().split("T")[0]}.csv"`,
  });

  return csvContent;
});
