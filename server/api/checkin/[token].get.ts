/** Public: the business behind a door QR link. */
export default defineEventHandler(async (event) => {
  const org = await getOrgByCheckInToken(String(getRouterParam(event, "token") || ""));
  if (!org) throw createError({ statusCode: 404, statusMessage: "This check-in link doesn't work" });
  setHeader(event, "Cache-Control", "no-store");
  return { name: org.name, type: org.type };
});
