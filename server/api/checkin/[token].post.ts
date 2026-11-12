/** Public: a member checks in by phone number after scanning the door QR. */
export default defineEventHandler(async (event) => {
  const token = String(getRouterParam(event, "token") || "");
  const org = await getOrgByCheckInToken(token);
  if (!org) throw createError({ statusCode: 404, statusMessage: "This check-in link doesn't work" });
  await enforceRateLimit(`checkin:${getClientIp(event)}`, { limit: 40, windowSeconds: 3600 });
  const body = await readBody<{ phone?: string }>(event);
  setHeader(event, "Cache-Control", "no-store");
  return selfCheckIn(org, String(body?.phone || ""));
});
