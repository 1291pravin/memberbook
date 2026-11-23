import { db, schema } from "@nuxthub/db";
import { eq } from "drizzle-orm";

/** Stop alerts on this phone/browser. */
export default defineEventHandler(async (event) => {
  await requireAdminAccess(event);
  const body = await readBody<{ endpoint?: unknown }>(event).catch(() => null);
  if (typeof body?.endpoint !== "string" || !body.endpoint) throw createError({ statusCode: 400, statusMessage: "Send endpoint" });
  await db.delete(schema.pushSubscriptions).where(eq(schema.pushSubscriptions.endpoint, body.endpoint));
  return { ok: true };
});
