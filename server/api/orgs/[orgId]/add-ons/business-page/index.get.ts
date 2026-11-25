import { and, eq, like, sql } from "drizzle-orm";

/** Free business page: its link and how many enquiries it brought in. */
export default defineEventHandler(async (event) => {
  const access = event.context.access;
  if (!(await isAddOnActive(access.orgId, "business_page"))) return { active: false };
  const [[org], [enq]] = await Promise.all([
    db.select({ slug: schema.organizations.slug, phone: schema.organizations.ownerWhatsapp, address: schema.organizations.gstAddress })
      .from(schema.organizations).where(eq(schema.organizations.id, access.orgId)).limit(1),
    db.select({ n: sql<number>`count(*)` }).from(schema.inquiries)
      .where(and(eq(schema.inquiries.orgId, access.orgId), like(schema.inquiries.notes, "%From your free business page%"))),
  ]);
  return { active: true, url: businessPageUrl(org!.slug), hasPhone: !!org!.phone, hasAddress: !!org!.address, enquiries: Number(enq?.n ?? 0) };
});
