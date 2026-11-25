import { eq } from "drizzle-orm";

// Public: the member taps "Pay online". Makes a Razorpay Payment Link on the
// owner's own account for the live amount owed, and returns its URL.
export default defineEventHandler(async (event) => {
  await enforceRateLimit(`pay-online:${getClientIp(event)}`, { limit: 20, windowSeconds: 3600 });
  const token = getRouterParam(event, "token") ?? "";
  const data = await loadPayLink(token);
  if (!data) throw createError({ statusCode: 404, statusMessage: "This payment link is not valid" });
  if (data.paid || data.amount <= 0) throw createError({ statusCode: 400, statusMessage: "Nothing is due on this link" });
  const creds = await getRazorpayCreds(data.link.orgId);
  if (!creds) throw createError({ statusCode: 400, statusMessage: "Online payment isn't set up. Please pay by UPI." });

  const [member] = await db.select({ phone: schema.members.phone }).from(schema.members)
    .where(eq(schema.members.id, data.link.memberId)).limit(1);
  const created = await createRazorpayPaymentLink(creds, {
    token,
    amount: data.amount,
    description: `${data.orgName}: ${data.link.kind === "renewal" ? "renewal of" : "pending for"} ${data.planName} plan`,
    memberName: data.memberName,
    memberPhone: member?.phone ?? null,
    callbackUrl: `${appBaseUrl(event)}/api/pay/${token}/online-return`,
  });
  if (!created.ok) {
    console.error(`[razorpay] org=${data.link.orgId} create link failed: ${created.error}`);
    throw createError({ statusCode: 502, statusMessage: "Couldn't start the online payment. Please pay by UPI." });
  }
  return { url: created.url };
});
