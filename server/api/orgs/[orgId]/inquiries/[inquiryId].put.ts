import { eq, and } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const access = await requireOrgAccess(event);
  const inquiryId = Number(getRouterParam(event, "inquiryId"));
  const body = await readBody(event);

  const updates: Record<string, unknown> = {};
  if (body.name) updates.name = body.name.trim();
  if (body.phone !== undefined) updates.phone = body.phone?.trim() || null;
  if (body.email !== undefined) updates.email = body.email?.trim() || null;
  if (body.interest !== undefined) updates.interest = body.interest?.trim() || null;
  if (body.followUpDate !== undefined) updates.followUpDate = body.followUpDate || null;
  if (body.status) updates.status = body.status;
  if (body.notes !== undefined) updates.notes = body.notes?.trim() || null;

  if (Object.keys(updates).length === 0) {
    throw createError({ statusCode: 400, statusMessage: "Nothing to update" });
  }

  await db
    .update(schema.inquiries)
    .set(updates)
    .where(and(eq(schema.inquiries.id, inquiryId), eq(schema.inquiries.orgId, access.orgId)));

  const rows = await db
    .select()
    .from(schema.inquiries)
    .where(and(eq(schema.inquiries.id, inquiryId), eq(schema.inquiries.orgId, access.orgId)))
    .limit(1);

  await invalidateCache(access.orgId, "inquiries");
  return { inquiry: rows[0] };
});
