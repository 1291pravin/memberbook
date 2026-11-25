// Public: Razorpay sends the member back here after paying. The signature
// proves the redirect came from Razorpay; the amount is read from Razorpay's
// API, then the payment is recorded and the member renewed.
export default defineEventHandler(async (event) => {
  setHeader(event, "Cache-Control", "no-store");
  const token = getRouterParam(event, "token") ?? "";
  const q = getQuery(event);
  const paymentId = String(q.razorpay_payment_id ?? "");
  const linkId = String(q.razorpay_payment_link_id ?? "");
  const refId = String(q.razorpay_payment_link_reference_id ?? "");
  const status = String(q.razorpay_payment_link_status ?? "");
  const signature = String(q.razorpay_signature ?? "");
  const back = (result: string) => sendRedirect(event, `/pay/${encodeURIComponent(token)}?online=${result}`, 302);

  const data = await loadPayLink(token);
  if (!data || tokenFromReference(refId) !== token) return back("failed");
  const creds = await getRazorpayCreds(data.link.orgId);
  if (!creds) return back("failed");
  if (!(await verifyHmac(creds.keySecret, `${linkId}|${refId}|${status}|${paymentId}`, signature))) return back("failed");
  if (status !== "paid") return back("failed");

  const payment = await fetchRazorpayPayment(creds, paymentId);
  if (!payment) return back("pending");
  try {
    const r = await recordRazorpayPayment(event, data.link.orgId, token, payment);
    return back(r.ok ? "paid" : "pending");
  }
  catch (err) {
    console.error(`[razorpay] org=${data.link.orgId} record failed`, err);
    return back("pending");
  }
});
