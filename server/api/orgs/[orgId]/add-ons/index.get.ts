import { and, desc, eq, inArray } from "drizzle-orm";

/** The add-ons menu: every add-on with this business's state, open bills and the website summary. */
export default defineEventHandler(async (event) => {
  const access = event.context.access;
  const [org] = await db.select({ type: schema.organizations.type, name: schema.organizations.name })
    .from(schema.organizations).where(eq(schema.organizations.id, access.orgId)).limit(1);

  const [states, bills, [website], requests] = await Promise.all([
    getOrgAddOnStates(access.orgId),
    db.select().from(schema.addOnBills)
      .where(and(eq(schema.addOnBills.orgId, access.orgId), inArray(schema.addOnBills.status, ["due", "claimed"])))
      .orderBy(desc(schema.addOnBills.period)).limit(6),
    db.select({ slug: schema.orgWebsites.slug, status: schema.orgWebsites.status, draftApprovedAt: schema.orgWebsites.draftApprovedAt, publishedAt: schema.orgWebsites.publishedAt })
      .from(schema.orgWebsites).where(eq(schema.orgWebsites.orgId, access.orgId)).limit(1),
    db.select({ type: schema.serviceRequests.type, status: schema.serviceRequests.status }).from(schema.serviceRequests)
      .where(eq(schema.serviceRequests.orgId, access.orgId)).orderBy(desc(schema.serviceRequests.id)).limit(50),
  ]);

  const visible = new Set(addOnsForType(org?.type).map(a => a.key));
  const { upiId, payeeName } = billingUpi(event);

  return {
    role: access.role,
    trialDays: FREE_TRIAL_DAYS,
    addOns: ADD_ONS.filter(a => visible.has(a.key)).map((def) => {
      const state = states.find((s: AddOnState) => s.key === def.key)!;
      return {
        key: def.key,
        name: def.name,
        tagline: def.tagline,
        points: def.points,
        price: state.price,
        page: def.page ?? null,
        ready: def.ready,
        available: state.available,
        status: state.status,
        trialEndsOn: state.trialEndsOn,
      };
    }),
    bills: bills.map((b: typeof schema.addOnBills.$inferSelect) => {
      const bill = serializeBill(b);
      return {
        ...bill,
        upiLink: upiId ? buildUpiLink({ upiId, payeeName, amount: bill.amount, note: `MemberBook add-ons ${bill.period}` }) : null,
      };
    }),
    billing: { upiId: upiId || null, payeeName },
    website: website
      ? { ...website, url: websiteUrl(event, website.slug) }
      : null,
    pendingRequests: requests.filter((r: { status: string }) => ["new", "working", "needs_review"].includes(r.status)).length,
  };
});
