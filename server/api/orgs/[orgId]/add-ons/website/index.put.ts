import { eq } from "drizzle-orm";

/** Save the details the owner confirmed for their website. */
export default defineEventHandler(async (event) => {
  const access = event.context.access;
  await ensureWebsite(access.orgId);
  const body = await readBody<{ details?: unknown }>(event);
  const details = cleanWebsiteDetails(body?.details);
  if (!details.businessName) throw createError({ statusCode: 400, statusMessage: "Business name is required" });
  if (details.googleMapsUrl && !/^https:\/\/([a-z0-9-]+\.)*(google\.[a-z.]+|goo\.gl|g\.co|maps\.app\.goo\.gl)\//i.test(details.googleMapsUrl)) {
    throw createError({ statusCode: 400, statusMessage: "Paste the link from Google Maps (Share → Copy link)" });
  }
  await db.update(schema.orgWebsites)
    .set({ details: JSON.stringify(details), updatedAt: new Date().toISOString() })
    .where(eq(schema.orgWebsites.orgId, access.orgId));
  return { details };
});
