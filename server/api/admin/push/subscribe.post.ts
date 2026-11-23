import { db, schema } from "@nuxthub/db";

/** Save this phone/browser so it gets an alert for every new inbox message. */
export default defineEventHandler(async (event) => {
  await requireAdminAccess(event);
  const body = await readBody<{ endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown }; device?: unknown }>(event).catch(() => null);
  const endpoint = typeof body?.endpoint === "string" ? body.endpoint : "";
  const p256dh = typeof body?.keys?.p256dh === "string" ? body.keys.p256dh : "";
  const auth = typeof body?.keys?.auth === "string" ? body.keys.auth : "";
  let host = "";
  try {
    const u = new URL(endpoint);
    if (u.protocol === "https:") host = u.hostname;
  }
  catch { /* checked below */ }
  if (!host || endpoint.length > 1000 || !/^[\w-]{80,100}$/.test(p256dh) || !/^[\w-]{16,32}$/.test(auth)) {
    throw createError({ statusCode: 400, statusMessage: "Not a valid push subscription" });
  }
  const device = typeof body?.device === "string" ? body.device.slice(0, 120) : null;
  await db.insert(schema.pushSubscriptions).values({ endpoint, p256dh, auth, device })
    .onConflictDoUpdate({ target: schema.pushSubscriptions.endpoint, set: { p256dh, auth, device, lastError: null } });
  await recordAdminAuditLog(event, "push_subscribe", { metadata: { host, device } });
  return { ok: true };
});
