/**
 * One-tap "mark paid" from the collections list.
 * Body: { subscriptionId, kind: "due" | "renewal", method?, date?, startDate? }
 *
 * - due: records a payment for the whole remaining balance.
 * - renewal: creates the next period on the same plan (starting the day after
 *   the current one ends, unless startDate is given) and records it as paid.
 */
export default defineEventHandler(async (event) => {
  const access = event.context.access;
  const body = await readBody(event) ?? {};
  const subscriptionId = Number(body.subscriptionId);
  const kind = body.kind;
  if (!Number.isInteger(subscriptionId) || subscriptionId <= 0 || (kind !== "due" && kind !== "renewal")) {
    throw createError({ statusCode: 400, statusMessage: "Subscription and kind are required" });
  }
  const method = body.method ?? "upi";
  if (!isPaymentMethod(method)) throw createError({ statusCode: 400, statusMessage: "Invalid payment method" });
  const date = body.date ?? todayIST();
  if (!isIsoDate(date)) throw createError({ statusCode: 400, statusMessage: "Invalid payment date" });

  return settleCollection(event, {
    orgId: access.orgId,
    subscriptionId,
    kind,
    method,
    date,
    startDate: body.startDate,
    notes: kind === "due" ? "Marked paid from Collections" : "Renewal marked paid from Collections",
  });
});
