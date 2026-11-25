// Razorpay webhook for one business (event payment_link.paid), so a payment is
// recorded even if the member closes the page before coming back. Signed with
// the webhook secret we generated for this business.
export default defineEventHandler(async (event) => {
  const orgId = Number(getRouterParam(event, "orgId"));
  if (!Number.isInteger(orgId) || orgId <= 0) throw createError({ statusCode: 404 });
  const raw = (await readRawBody(event, "utf8")) ?? "";
  const creds = await getRazorpayCreds(orgId);
  if (!creds?.webhookSecret) throw createError({ statusCode: 404 });
  const signature = getHeader(event, "x-razorpay-signature") ?? "";
  if (!(await verifyHmac(creds.webhookSecret, raw, signature))) throw createError({ statusCode: 401 });

  let body: { event?: string; payload?: { payment_link?: { entity?: { reference_id?: string } }; payment?: { entity?: { id?: string } } } };
  try {
    body = JSON.parse(raw);
  }
  catch {
    throw createError({ statusCode: 400 });
  }
  if (body.event !== "payment_link.paid") return { ok: true, ignored: body.event };

  const token = tokenFromReference(body.payload?.payment_link?.entity?.reference_id);
  const paymentId = body.payload?.payment?.entity?.id;
  if (!token || !paymentId) return { ok: true, ignored: "no reference" };
  // Re-read the payment from Razorpay rather than trusting the body for the amount.
  const payment = await fetchRazorpayPayment(creds, paymentId);
  if (!payment) throw createError({ statusCode: 502 });
  const r = await recordRazorpayPayment(event, orgId, token, payment);
  return { ok: true, recorded: r.ok, reason: r.reason };
});
