import { db, schema } from "@nuxthub/db";

/** Phones that get inbox alerts. */
export default defineEventHandler(async (event) => {
  await requireAdminAccess(event);
  const rows = await db.select({
    endpoint: schema.pushSubscriptions.endpoint,
    device: schema.pushSubscriptions.device,
    lastSentAt: schema.pushSubscriptions.lastSentAt,
    lastError: schema.pushSubscriptions.lastError,
    createdAt: schema.pushSubscriptions.createdAt,
  }).from(schema.pushSubscriptions);
  return { devices: rows };
});
