import { eq } from "drizzle-orm";

/**
 * Remove a photo from the list. The file itself is kept in storage because a
 * published site may still show it until the next rebuild.
 */
export default defineEventHandler(async (event) => {
  const access = event.context.access;
  const site = await ensureWebsite(access.orgId);
  const index = Number(getRouterParam(event, "index"));
  const files = parseJson<WebsiteFile[]>(site.files, []);
  if (!Number.isInteger(index) || !files[index]) throw createError({ statusCode: 404, statusMessage: "Photo not found" });
  files.splice(index, 1);
  await db.update(schema.orgWebsites)
    .set({ files: JSON.stringify(files), updatedAt: new Date().toISOString() })
    .where(eq(schema.orgWebsites.orgId, access.orgId));
  return { count: files.length };
});
