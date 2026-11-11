// Meta calls this once when the webhook is configured, to check the verify token.
export default defineEventHandler((event) => {
  const q = getQuery(event);
  const expected = getWhatsAppCloudConfig().webhookVerifyToken;
  if (q["hub.mode"] === "subscribe" && expected && q["hub.verify_token"] === expected) {
    setHeader(event, "Content-Type", "text/plain");
    return String(q["hub.challenge"] ?? "");
  }
  throw createError({ statusCode: 403, statusMessage: "Verification failed" });
});
