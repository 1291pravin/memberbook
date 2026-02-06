import { eq, desc } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const access = event.context.access;

  const rows = await db
    .select({
      memberName: schema.members.name,
      memberPhone: schema.members.phone,
      amount: schema.payments.amount,
      method: schema.payments.method,
      date: schema.payments.date,
      plan: schema.subscriptionPlans.name,
      notes: schema.payments.notes,
    })
    .from(schema.payments)
    .innerJoin(schema.members, eq(schema.payments.memberId, schema.members.id))
    .leftJoin(schema.memberSubscriptions, eq(schema.payments.subscriptionId, schema.memberSubscriptions.id))
    .leftJoin(schema.subscriptionPlans, eq(schema.memberSubscriptions.planId, schema.subscriptionPlans.id))
    .where(eq(schema.payments.orgId, access.orgId))
    .orderBy(desc(schema.payments.date))
    .limit(10000);

  const headers = ["memberName", "memberPhone", "amount", "method", "date", "plan", "notes"];

  const csvRows = rows.map((r: typeof rows[number]) => ({
    ...r,
    amount: (r.amount / 100).toFixed(2),
  }));

  const csv = generateCsv(headers, csvRows);

  setResponseHeader(event, "Content-Type", "text/csv; charset=utf-8");
  setResponseHeader(event, "Content-Disposition", "attachment; filename=payments.csv");
  return csv;
});
