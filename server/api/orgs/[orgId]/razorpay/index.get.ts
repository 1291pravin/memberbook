import { eq } from "drizzle-orm";

// Owner: is the business's own Razorpay connected? Never returns the secrets.
export default defineEventHandler(async (event) => {
  const access = event.context.access;
  requireOwner(access);
  const [org] = await db.select({
    keyId: schema.organizations.razorpayKeyId,
    connectedAt: schema.organizations.razorpayConnectedAt,
    webhookSecretEnc: schema.organizations.razorpayWebhookSecretEnc,
  }).from(schema.organizations).where(eq(schema.organizations.id, access.orgId)).limit(1);
  const connected = !!org?.keyId;
  const webhookSecret = connected ? await decryptSecret(org!.webhookSecretEnc) : null;
  return {
    connected,
    keyId: connected ? `${org!.keyId!.slice(0, 13)}…${org!.keyId!.slice(-4)}` : null,
    testMode: connected ? org!.keyId!.startsWith("rzp_test_") : false,
    connectedAt: org?.connectedAt ?? null,
    // The owner pastes these into Razorpay (Settings > Webhooks) so payments confirm even if the member closes the page.
    webhookUrl: razorpayWebhookUrl(event, access.orgId),
    webhookSecret,
  };
});
