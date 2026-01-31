import { eq, and } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const access = event.context.access;
  const planId = Number(getRouterParam(event, "planId"));
  const body = await readBody(event);

  const updates: Record<string, unknown> = {};
  if (body.name) updates.name = body.name.trim();
  if (body.price !== undefined) updates.price = Number(body.price);
  if (body.durationDays !== undefined) updates.durationDays = Number(body.durationDays);
  if (body.active !== undefined) updates.active = body.active;

  if (Object.keys(updates).length === 0) {
    throw createError({ statusCode: 400, statusMessage: "Nothing to update" });
  }

  await db
    .update(schema.subscriptionPlans)
    .set(updates)
    .where(and(eq(schema.subscriptionPlans.id, planId), eq(schema.subscriptionPlans.orgId, access.orgId)));

  const rows = await db
    .select()
    .from(schema.subscriptionPlans)
    .where(and(eq(schema.subscriptionPlans.id, planId), eq(schema.subscriptionPlans.orgId, access.orgId)))
    .limit(1);

  await invalidateCache(access.orgId, "plans");
  return { plan: rows[0] };
});
