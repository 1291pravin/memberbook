import { eq } from "drizzle-orm";

// Owner: disconnect Razorpay. Pay links go back to direct UPI.
export default defineEventHandler(async (event) => {
  const access = event.context.access;
  requireOwner(access);
  await db.update(schema.organizations).set({
    razorpayKeyId: null,
    razorpayKeySecretEnc: null,
    razorpayWebhookSecretEnc: null,
    razorpayConnectedAt: null,
  }).where(eq(schema.organizations.id, access.orgId));
  return { ok: true };
});
