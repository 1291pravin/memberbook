// Public: the member taps "I have paid". The owner sees it in Collections and
// confirms; automatic reminders stop for this payment.
export default defineEventHandler(async (event) => {
  await enforceRateLimit(`pay-claim:${getClientIp(event)}`, { limit: 20, windowSeconds: 3600 });
  const data = await loadPayLink(getRouterParam(event, "token") ?? "");
  if (!data) throw createError({ statusCode: 404, statusMessage: "This payment link is not valid" });
  if (!data.paid) await markPayLinkClaimed(data.link.id);
  return { ok: true };
});
