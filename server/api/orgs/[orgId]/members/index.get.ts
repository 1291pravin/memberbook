import { eq, and, like, or, sql, lt, between, desc, asc } from "drizzle-orm";

export default cachedEventHandler(async (event) => {
  const access = event.context.access;
  const query = getQuery(event);
  const search = query.search as string | undefined;
  const status = query.status as string | undefined;
  const subscription = query.subscription as string | undefined;
  const payment = query.payment as string | undefined;
  const sort = (query.sort as string) || "newest";

  const today = new Date().toISOString().split("T")[0];
  const weekLater = new Date();
  weekLater.setDate(weekLater.getDate() + 7);
  const weekStr = weekLater.toISOString().split("T")[0];

  // Subquery: latest subscription per member
  const latestSub = db
    .select({
      memberId: schema.memberSubscriptions.memberId,
      maxId: sql<number>`MAX(${schema.memberSubscriptions.id})`.as("max_id"),
    })
    .from(schema.memberSubscriptions)
    .where(eq(schema.memberSubscriptions.orgId, access.orgId))
    .groupBy(schema.memberSubscriptions.memberId)
    .as("latest_sub");

  // Base query: members left-joined with their latest subscription + plan
  const conditions = [eq(schema.members.orgId, access.orgId)];

  if (status && status !== "all") {
    conditions.push(eq(schema.members.status, status));
  }

  if (search) {
    conditions.push(
      or(
        like(schema.members.name, `%${search}%`),
        like(schema.members.phone, `%${search}%`),
      )!,
    );
  }

  // Subscription filter conditions on the joined subscription
  if (subscription === "expired") {
    conditions.push(lt(schema.memberSubscriptions.endDate, today));
  } else if (subscription === "expiring") {
    conditions.push(between(schema.memberSubscriptions.endDate, today, weekStr));
  } else if (subscription === "no-subscription") {
    conditions.push(sql`${latestSub.maxId} IS NULL`);
  }

  // Payment status filter on the latest subscription
  if (payment === "unpaid") {
    conditions.push(eq(schema.memberSubscriptions.paymentStatus, "unpaid"));
  } else if (payment === "partial") {
    conditions.push(eq(schema.memberSubscriptions.paymentStatus, "partial"));
  } else if (payment === "unpaid-or-partial") {
    conditions.push(
      or(
        eq(schema.memberSubscriptions.paymentStatus, "unpaid"),
        eq(schema.memberSubscriptions.paymentStatus, "partial"),
      )!,
    );
  }

  const memberList = await db
    .select({
      id: schema.members.id,
      orgId: schema.members.orgId,
      name: schema.members.name,
      phone: schema.members.phone,
      email: schema.members.email,
      status: schema.members.status,
      notes: schema.members.notes,
      createdAt: schema.members.createdAt,
      subscriptionEndDate: schema.memberSubscriptions.endDate,
      subscriptionStatus: schema.memberSubscriptions.status,
      paymentStatus: schema.memberSubscriptions.paymentStatus,
      planName: schema.subscriptionPlans.name,
    })
    .from(schema.members)
    .leftJoin(latestSub, eq(schema.members.id, latestSub.memberId))
    .leftJoin(schema.memberSubscriptions, eq(latestSub.maxId, schema.memberSubscriptions.id))
    .leftJoin(schema.subscriptionPlans, eq(schema.memberSubscriptions.planId, schema.subscriptionPlans.id))
    .where(and(...conditions))
    .orderBy(
      sort === "name-asc" ? asc(schema.members.name)
        : sort === "name-desc" ? desc(schema.members.name)
          : sort === "oldest" ? asc(schema.members.createdAt)
            : desc(schema.members.createdAt),
    );

  return { members: memberList };
}, {
  maxAge: 3600,
  getKey: (event) => orgCacheKey(event, "members"),
});
