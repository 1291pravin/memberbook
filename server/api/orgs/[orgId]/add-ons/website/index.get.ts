import { desc, eq, and, inArray } from "drizzle-orm";

/** The business's website: details, photos, status and the latest build request. */
export default defineEventHandler(async (event) => {
  const access = event.context.access;
  const site = await ensureWebsite(access.orgId);
  const [org] = await db.select({
    name: schema.organizations.name,
    type: schema.organizations.type,
    ownerWhatsapp: schema.organizations.ownerWhatsapp,
  }).from(schema.organizations).where(eq(schema.organizations.id, access.orgId)).limit(1);

  const [requests, active] = await Promise.all([
    db.select().from(schema.serviceRequests)
      .where(and(eq(schema.serviceRequests.orgId, access.orgId), inArray(schema.serviceRequests.type, ["website_build", "website_change"])))
      .orderBy(desc(schema.serviceRequests.id)).limit(10),
    isAddOnActive(access.orgId, "website"),
  ]);

  const files = parseJson<WebsiteFile[]>(site.files, []);
  return {
    active,
    role: access.role,
    slug: site.slug,
    url: websiteUrl(event, site.slug),
    status: site.status,
    details: parseJson<WebsiteDetails>(site.details, {}),
    defaults: { businessName: org?.name ?? "", whatsapp: org?.ownerWhatsapp ?? "", type: org?.type ?? "" },
    files: files.map((f, index) => ({ index, name: f.name, kind: f.kind, url: `/s/${site.slug}/img/${index}` })),
    hasDraft: Boolean(site.draftHtml),
    draftApproved: Boolean(site.draftApprovedAt),
    draftDiffersFromLive: Boolean(site.draftHtml && site.draftHtml !== site.liveHtml),
    publishedAt: site.publishedAt,
    requests: requests.map(serializeRequest).map((r: ReturnType<typeof serializeRequest>) => ({ id: r.id, type: r.type, status: r.status, message: r.message, change: r.input.change ?? null, createdAt: r.createdAt })),
  };
});
