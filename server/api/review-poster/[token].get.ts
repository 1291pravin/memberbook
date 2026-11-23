/** Public: what the printable review poster needs (business name and type). */
export default defineEventHandler(async (event) => {
  const org = await getOrgByReviewToken(String(getRouterParam(event, "token") || ""));
  if (!org) throw createError({ statusCode: 404, statusMessage: "This poster link doesn't work" });
  setHeader(event, "Cache-Control", "no-store");
  return { name: org.name, type: org.type };
});
