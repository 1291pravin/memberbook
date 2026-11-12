import { and, eq, inArray } from "drizzle-orm";

/** Owner publishes the approved draft, or takes the site offline ({ action: "unpublish" }). */
export default defineEventHandler(async (event) => {
  const access = event.context.access;
  requireOwner(access);
  const site = await ensureWebsite(access.orgId);
  const body = await readBody<{ action?: string }>(event);
  const now = new Date().toISOString();

  if (body?.action === "unpublish") {
    await db.update(schema.orgWebsites).set({ status: "off", updatedAt: now }).where(eq(schema.orgWebsites.orgId, access.orgId));
    return { status: "off" };
  }

  await requireAddOn(access.orgId, "website");
  if (!site.draftHtml || !site.draftApprovedAt) {
    // Re-publishing a site that was taken offline needs no new approval.
    if (site.liveHtml && site.status === "off") {
      await db.update(schema.orgWebsites).set({ status: "live", updatedAt: now }).where(eq(schema.orgWebsites.orgId, access.orgId));
      return { status: "live" };
    }
    throw createError({ statusCode: 409, statusMessage: "Your website is still being made. We'll let you know when it's ready." });
  }

  await db.update(schema.orgWebsites)
    .set({ liveHtml: site.draftHtml, status: "live", publishedAt: now, updatedAt: now })
    .where(eq(schema.orgWebsites.orgId, access.orgId));
  await db.update(schema.serviceRequests)
    .set({ status: "done", updatedAt: now })
    .where(and(eq(schema.serviceRequests.orgId, access.orgId), eq(schema.serviceRequests.status, "ready"), inArray(schema.serviceRequests.type, ["website_build", "website_change"])));
  return { status: "live", url: websiteUrl(event, site.slug) };
});
