import { eq } from "drizzle-orm";

/**
 * Admin switches for one business. { addOn, action }:
 * enable / disable = the per-business feature flag (lets it use an add-on that
 * isn't open to everyone yet); start / stop = switch it on or off for them.
 */
export default defineEventHandler(async (event) => {
  await requireAdminAccess(event);
  const orgId = Number(getRouterParam(event, "orgId"));
  const [org] = await db.select({ id: schema.organizations.id }).from(schema.organizations).where(eq(schema.organizations.id, orgId)).limit(1);
  if (!org) throw createError({ statusCode: 404, statusMessage: "Business not found" });
  const body = await readBody<{ addOn?: string; action?: string }>(event);
  const key = String(body?.addOn || "") as AddOnKey;
  if (!getAddOn(key)) throw createError({ statusCode: 400, statusMessage: "Unknown add-on" });

  switch (body?.action) {
    case "enable": await setAddOnAdminEnabled(orgId, key, true); break;
    case "disable": await setAddOnAdminEnabled(orgId, key, false); break;
    case "start": await startAddOn(orgId, key); break;
    case "stop": await stopAddOn(orgId, key); break;
    default: throw createError({ statusCode: 400, statusMessage: "action must be enable, disable, start or stop" });
  }
  await db.insert(schema.adminAuditLogs).values({ action: `add_on_${body.action}`, targetOrgId: orgId, metadata: JSON.stringify({ addOn: key }) });
  return (await getOrgAddOnStates(orgId)).find(s => s.key === key);
});
