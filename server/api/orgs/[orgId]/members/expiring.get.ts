import { eq, and, between } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const access = await requireOrgAccess(event);
  const today = new Date().toISOString().split("T")[0];
  const weekLater = new Date();
  weekLater.setDate(weekLater.getDate() + 7);
  const weekStr = weekLater.toISOString().split("T")[0];

  const expiring = await db
    .select({
      memberId: schema.members.id,
      memberName: schema.members.name,
      memberPhone: schema.members.phone,
      planName: schema.subscriptionPlans.name,
      endDate: schema.memberSubscriptions.endDate,
      amount: schema.memberSubscriptions.amount,
    })
    .from(schema.memberSubscriptions)
    .innerJoin(schema.members, eq(schema.memberSubscriptions.memberId, schema.members.id))
    .innerJoin(schema.subscriptionPlans, eq(schema.memberSubscriptions.planId, schema.subscriptionPlans.id))
    .where(
      and(
        eq(schema.memberSubscriptions.orgId, access.orgId),
        eq(schema.memberSubscriptions.status, "active"),
        between(schema.memberSubscriptions.endDate, today, weekStr),
      ),
    )
    .orderBy(schema.memberSubscriptions.endDate);

  return { expiring };
});
