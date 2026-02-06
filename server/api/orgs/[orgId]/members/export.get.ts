import { eq, sql, desc } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const access = event.context.access;

  // Latest subscription per member (same pattern as members/index.get.ts)
  const latestSub = db
    .select({
      memberId: schema.memberSubscriptions.memberId,
      maxId: sql<number>`MAX(${schema.memberSubscriptions.id})`.as("max_id"),
    })
    .from(schema.memberSubscriptions)
    .where(eq(schema.memberSubscriptions.orgId, access.orgId))
    .groupBy(schema.memberSubscriptions.memberId)
    .as("latest_sub");

  const rows = await db
    .select({
      name: schema.members.name,
      phone: schema.members.phone,
      email: schema.members.email,
      status: schema.members.status,
      notes: schema.members.notes,
      plan: schema.subscriptionPlans.name,
      planPrice: schema.subscriptionPlans.price,
      startDate: schema.memberSubscriptions.startDate,
      endDate: schema.memberSubscriptions.endDate,
      subscriptionStatus: schema.memberSubscriptions.status,
      paymentStatus: schema.memberSubscriptions.paymentStatus,
      createdAt: schema.members.createdAt,
    })
    .from(schema.members)
    .leftJoin(latestSub, eq(schema.members.id, latestSub.memberId))
    .leftJoin(schema.memberSubscriptions, eq(latestSub.maxId, schema.memberSubscriptions.id))
    .leftJoin(schema.subscriptionPlans, eq(schema.memberSubscriptions.planId, schema.subscriptionPlans.id))
    .where(eq(schema.members.orgId, access.orgId))
    .orderBy(desc(schema.members.createdAt))
    .limit(10000);

  const headers = [
    "name", "phone", "email", "status", "notes",
    "plan", "planPrice", "startDate", "endDate",
    "subscriptionStatus", "paymentStatus", "createdAt",
  ];

  // Convert paise to rupees for planPrice
  const csvRows = rows.map((r: typeof rows[number]) => ({
    ...r,
    planPrice: r.planPrice != null ? (r.planPrice / 100).toFixed(2) : "",
  }));

  const csv = generateCsv(headers, csvRows);

  setResponseHeader(event, "Content-Type", "text/csv; charset=utf-8");
  setResponseHeader(event, "Content-Disposition", "attachment; filename=members.csv");
  return csv;
});
