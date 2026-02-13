import { eq, and } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const access = event.context.access;
  const memberId = Number(getRouterParam(event, "memberId"));
  const body = await readBody(event);

  const updates: Record<string, unknown> = {};
  if (body.name) updates.name = body.name.trim();
  if (body.phone !== undefined) updates.phone = body.phone?.trim() || null;
  if (body.email !== undefined) updates.email = body.email?.trim() || null;
  if (body.status) updates.status = body.status;
  if (body.notes !== undefined) updates.notes = body.notes?.trim() || null;

  if (Object.keys(updates).length === 0) {
    throw createError({ statusCode: 400, statusMessage: "Nothing to update" });
  }

  await db
    .update(schema.members)
    .set(updates)
    .where(and(eq(schema.members.id, memberId), eq(schema.members.orgId, access.orgId)));

  const rows = await db
    .select()
    .from(schema.members)
    .where(and(eq(schema.members.id, memberId), eq(schema.members.orgId, access.orgId)))
    .limit(1);

  await invalidateCache(access.orgId);
  return { member: rows[0] };
});
