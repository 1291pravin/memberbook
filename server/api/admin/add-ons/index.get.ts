import { desc, eq, inArray, sql } from "drizzle-orm";

/** Admin overview of add-ons: who has what, who's waiting for what, bills, and websites. */
export default defineEventHandler(async (event) => {
  await requireAdminAccess(event);
  const [addOnRows, bills, sites] = await Promise.all([
    db.select({ row: schema.orgAddOns, orgName: schema.organizations.name })
      .from(schema.orgAddOns).innerJoin(schema.organizations, eq(schema.organizations.id, schema.orgAddOns.orgId))
      .where(sql`${schema.orgAddOns.status} != 'off' OR ${schema.orgAddOns.adminEnabled} = 1`),
    db.select({ bill: schema.addOnBills, orgName: schema.organizations.name })
      .from(schema.addOnBills).innerJoin(schema.organizations, eq(schema.organizations.id, schema.addOnBills.orgId))
      .where(inArray(schema.addOnBills.status, ["due", "claimed"]))
      .orderBy(desc(schema.addOnBills.id)).limit(100),
    db.select({ orgId: schema.orgWebsites.orgId, slug: schema.orgWebsites.slug, status: schema.orgWebsites.status, publishedAt: schema.orgWebsites.publishedAt, orgName: schema.organizations.name })
      .from(schema.orgWebsites).innerJoin(schema.organizations, eq(schema.organizations.id, schema.orgWebsites.orgId))
      .where(sql`${schema.orgWebsites.liveHtml} IS NOT NULL`),
  ]);

  return {
    catalog: ADD_ONS.map(a => ({ key: a.key, name: a.name, price: a.price, ready: a.ready, waitingOn: a.waitingOn ?? null })),
    addOns: addOnRows.map(({ row, orgName }: { row: typeof schema.orgAddOns.$inferSelect; orgName: string }) => ({
      orgId: row.orgId,
      orgName,
      addOn: row.addOn,
      status: row.status,
      adminEnabled: row.adminEnabled,
      price: row.price,
      trialEndsOn: row.trialEndsOn,
      notifyRequestedAt: row.notifyRequestedAt,
    })),
    bills: bills.map(({ bill, orgName }: { bill: typeof schema.addOnBills.$inferSelect; orgName: string }) => ({ ...serializeBill(bill), orgName })),
    websites: sites.map((s: { orgId: number; slug: string; status: string; publishedAt: string | null; orgName: string }) => ({ ...s, url: websiteUrl(event, s.slug) })),
    billingUpiSet: Boolean(billingUpi(event).upiId),
  };
});
