import { and, eq, gt, ne, sql } from "drizzle-orm";
import { db, schema } from "@nuxthub/db";

/** Load a public pay link and work out, live, whether it is still owed. */
export async function loadPayLink(token: string) {
  if (!/^[A-Za-z0-9_-]{10,40}$/.test(token)) return null;

  const [row] = await db
    .select({
      link: schema.paymentLinks,
      orgName: schema.organizations.name,
      orgType: schema.organizations.type,
      upiId: schema.organizations.upiId,
      upiPayeeName: schema.organizations.upiPayeeName,
      memberName: schema.members.name,
      planName: schema.subscriptionPlans.name,
      subAmount: schema.memberSubscriptions.amount,
      subStatus: schema.memberSubscriptions.status,
      endDate: schema.memberSubscriptions.endDate,
    })
    .from(schema.paymentLinks)
    .innerJoin(schema.organizations, eq(schema.organizations.id, schema.paymentLinks.orgId))
    .innerJoin(schema.members, eq(schema.members.id, schema.paymentLinks.memberId))
    .innerJoin(schema.memberSubscriptions, eq(schema.memberSubscriptions.id, schema.paymentLinks.subscriptionId))
    .innerJoin(schema.subscriptionPlans, eq(schema.subscriptionPlans.id, schema.memberSubscriptions.planId))
    .where(eq(schema.paymentLinks.token, token))
    .limit(1);
  if (!row) return null;

  const { link } = row;
  let amount = link.amount;
  let paid = link.status === "paid" || row.subStatus === "cancelled";

  if (!paid && link.kind === "due") {
    const total = await getSubscriptionPaidTotal(link.subscriptionId, link.orgId);
    amount = row.subAmount - total;
    paid = amount <= 0;
  }
  else if (!paid && link.kind === "renewal") {
    const [newer] = await db.select({ id: schema.memberSubscriptions.id })
      .from(schema.memberSubscriptions)
      .where(and(
        eq(schema.memberSubscriptions.orgId, link.orgId),
        eq(schema.memberSubscriptions.memberId, link.memberId),
        ne(schema.memberSubscriptions.status, "cancelled"),
        gt(schema.memberSubscriptions.id, link.subscriptionId),
      ))
      .limit(1);
    paid = !!newer;
  }

  return { ...row, link, amount, paid };
}

export async function markPayLinkClaimed(id: number) {
  const now = new Date().toISOString();
  await db.update(schema.paymentLinks)
    .set({ claimedAt: now, updatedAt: now })
    .where(and(eq(schema.paymentLinks.id, id), sql`${schema.paymentLinks.claimedAt} IS NULL`));
}
