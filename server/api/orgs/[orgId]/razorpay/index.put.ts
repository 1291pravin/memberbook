import { eq } from "drizzle-orm";

// Owner: connect their own Razorpay account. Keys are checked with Razorpay, then stored encrypted.
export default defineEventHandler(async (event) => {
  const access = event.context.access;
  requireOwner(access);
  await enforceRateLimit(`razorpay-connect:${access.orgId}`, { limit: 10, windowSeconds: 3600 });
  const body = await readBody(event) ?? {};
  const keyId = String(body.keyId ?? "").trim();
  const keySecret = String(body.keySecret ?? "").trim();
  if (!isRazorpayKeyId(keyId)) throw createError({ statusCode: 400, statusMessage: "The Key ID starts with rzp_live_ or rzp_test_" });
  if (!/^[A-Za-z0-9]{10,64}$/.test(keySecret)) throw createError({ statusCode: 400, statusMessage: "Please paste the Key Secret from Razorpay" });

  const check = await verifyRazorpayKeys(keyId, keySecret);
  if (!check.ok) throw createError({ statusCode: 400, statusMessage: check.error || "Razorpay didn't accept these keys" });

  // A webhook secret we make up; the owner pastes it into Razorpay along with the URL.
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  const webhookSecret = btoa(String.fromCharCode(...bytes)).replace(/[^A-Za-z0-9]/g, "").slice(0, 24);

  await db.update(schema.organizations).set({
    razorpayKeyId: keyId,
    razorpayKeySecretEnc: await encryptSecret(keySecret),
    razorpayWebhookSecretEnc: await encryptSecret(webhookSecret),
    razorpayConnectedAt: new Date().toISOString(),
  }).where(eq(schema.organizations.id, access.orgId));
  return { ok: true };
});
