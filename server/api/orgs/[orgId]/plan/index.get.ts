import { and, desc, eq, inArray } from "drizzle-orm";

/** The Plan page: the business's current plan, open bills and which features it can use. */
export default defineEventHandler(async (event) => {
  const access = event.context.access;
  const [plan, bills, org, features] = await Promise.all([
    getOrgPlan(access.orgId),
    db.select().from(schema.addOnBills)
      .where(and(eq(schema.addOnBills.orgId, access.orgId), inArray(schema.addOnBills.status, ["due", "claimed"])))
      .orderBy(desc(schema.addOnBills.period)).limit(6),
    db.select({ type: schema.organizations.type, upiId: schema.organizations.upiId, autoRemindersEnabled: schema.organizations.autoRemindersEnabled })
      .from(schema.organizations).where(eq(schema.organizations.id, access.orgId)).limit(1).then((r: unknown[]) => r[0] as { type: string | null; upiId: string | null; autoRemindersEnabled: boolean } | undefined),
    Promise.all((["business_page", "review_poster", "self_check_in", "online_payments", "website", "reviews", "own_number"] as AddOnKey[])
      .map(async k => [k, await isAddOnActive(access.orgId, k)] as const)),
  ]);
  const { upiId, payeeName } = billingUpi(event);
  return {
    role: access.role,
    businessType: org?.type ?? null,
    plan,
    hasUpiId: Boolean(org?.upiId),
    autoRemindersEnabled: Boolean(org?.autoRemindersEnabled),
    features: Object.fromEntries(features) as Record<string, boolean>,
    bills: bills.map((b: typeof schema.addOnBills.$inferSelect) => {
      const bill = serializeBill(b);
      return {
        ...bill,
        upiLink: upiId ? buildUpiLink({ upiId, payeeName, amount: bill.amount, note: `MemberBook ${bill.items[0]?.name ?? "plan"}` }) : null,
      };
    }),
    billing: { upiId: upiId || null, payeeName },
  };
});
