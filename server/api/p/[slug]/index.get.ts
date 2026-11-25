// Public: a business's free page (/p/<slug>).
export default defineEventHandler(async (event) => {
  setHeader(event, "Cache-Control", "public, max-age=60");
  const data = await loadBusinessPage(String(getRouterParam(event, "slug") || ""));
  if (!data) throw createError({ statusCode: 404, statusMessage: "Page not found" });
  return data;
});
