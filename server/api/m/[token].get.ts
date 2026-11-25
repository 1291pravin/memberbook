// Public: a member's own page (/m/<token>), shared by the business.
export default defineEventHandler(async (event) => {
  setHeader(event, "Cache-Control", "no-store");
  setHeader(event, "X-Robots-Tag", "noindex");
  const data = await loadMemberPortal(getRouterParam(event, "token") ?? "");
  if (!data) throw createError({ statusCode: 404, statusMessage: "This link is not valid" });
  return data;
});
