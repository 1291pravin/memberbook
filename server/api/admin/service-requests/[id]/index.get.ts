import { eq } from "drizzle-orm";

/**
 * Everything the delivery routine needs for one request: the business, its
 * plans and prices, and for websites the owner's details, photo list and the
 * current page (to edit for a change request).
 */
export default defineEventHandler(async (event) => {
  await requireAdminAccess(event);
  const req = await getServiceRequestOr404(event);

  const [org] = await db.select({
    id: schema.organizations.id,
    name: schema.organizations.name,
    type: schema.organizations.type,
    ownerWhatsapp: schema.organizations.ownerWhatsapp,
  }).from(schema.organizations).where(eq(schema.organizations.id, req.orgId)).limit(1);

  const out: Record<string, unknown> = { ...serializeRequest(req), org, today: todayIST() };

  if (req.type === "website_build" || req.type === "website_change") {
    const site = await ensureWebsite(req.orgId);
    const plans = await db.select({
      name: schema.subscriptionPlans.name,
      price: schema.subscriptionPlans.price,
      durationType: schema.subscriptionPlans.durationType,
      durationValue: schema.subscriptionPlans.durationValue,
      active: schema.subscriptionPlans.active,
    }).from(schema.subscriptionPlans).where(eq(schema.subscriptionPlans.orgId, req.orgId));

    out.website = {
      slug: site.slug,
      url: websiteUrl(event, site.slug),
      status: site.status,
      details: parseJson<WebsiteDetails>(site.details, {}),
      files: parseJson<WebsiteFile[]>(site.files, []).map((f, index) => ({
        index,
        kind: f.kind,
        name: f.name,
        type: f.type,
        // Use this path in the HTML; it works on memberbook.in and on the subdomain.
        src: `/s/${site.slug}/img/${index}`,
      })),
      manifest: `/s/${site.slug}/manifest.webmanifest`,
      enquiryAction: `/s/${site.slug}/enquiry`,
      currentHtml: site.draftHtml || site.liveHtml || null,
    };
    out.plans = plans.filter(p => p.active).map(p => ({ ...p, price: p.price / 100 }));
  }
  return out;
});
