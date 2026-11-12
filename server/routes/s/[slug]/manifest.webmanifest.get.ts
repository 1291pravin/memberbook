/** Web app manifest, so members can add the business's website to their home screen. */
export default defineEventHandler(async (event) => {
  const site = await getWebsiteBySlug(String(getRouterParam(event, "slug") || ""));
  if (!site || site.status !== "live") throw createError({ statusCode: 404, statusMessage: "Not found" });
  const details = parseJson<WebsiteDetails>(site.details, {});
  const files = parseJson<WebsiteFile[]>(site.files, []);
  const logoIndex = files.findIndex(f => f.kind === "logo");
  const name = details.businessName || "Our website";
  setHeader(event, "Content-Type", "application/manifest+json");
  setHeader(event, "Cache-Control", "public, max-age=3600");
  return {
    name,
    short_name: name.length > 12 ? name.split(/\s+/)[0] : name,
    start_url: `/s/${site.slug}`,
    scope: `/s/${site.slug}`,
    display: "standalone",
    background_color: "#ffffff",
    theme_color: /^#[0-9a-f]{6}$/i.test(details.colours || "") ? details.colours : "#0f766e",
    icons: logoIndex >= 0
      ? [{ src: `/s/${site.slug}/img/${logoIndex}`, sizes: "512x512", type: files[logoIndex]!.type, purpose: "any" }]
      : [
          { src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
        ],
  };
});
