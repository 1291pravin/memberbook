import { blob } from "@nuxthub/blob";

/** A logo or photo of a business website (public: the site shows them). */
export default defineEventHandler(async (event) => {
  const site = await getWebsiteBySlug(String(getRouterParam(event, "slug") || ""));
  const index = Number(String(getRouterParam(event, "index") || "").replace(/\.\w+$/, ""));
  const file = site ? parseJson<WebsiteFile[]>(site.files, [])[index] : undefined;
  if (!file || !Number.isInteger(index)) throw createError({ statusCode: 404, statusMessage: "Not found" });
  setHeader(event, "Cache-Control", "public, max-age=86400");
  setHeader(event, "X-Content-Type-Options", "nosniff");
  if (file.type === "image/svg+xml") setHeader(event, "Content-Security-Policy", "script-src 'none'; sandbox");
  return blob.serve(event, file.key);
});
