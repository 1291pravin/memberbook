import { blob } from "@nuxthub/blob";

/** Download one of a website's photos (for the routine to look at). */
export default defineEventHandler(async (event) => {
  await requireAdminAccess(event);
  const req = await getServiceRequestOr404(event);
  const site = await ensureWebsite(req.orgId);
  const index = Number(getRouterParam(event, "index"));
  const file = parseJson<WebsiteFile[]>(site.files, [])[index];
  if (!file) throw createError({ statusCode: 404, statusMessage: "File not found" });
  setHeader(event, "Cache-Control", "private, no-store");
  return blob.serve(event, file.key);
});
