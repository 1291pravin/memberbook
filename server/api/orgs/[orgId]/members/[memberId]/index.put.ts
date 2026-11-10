import { eq, and } from "drizzle-orm";
import { normalizePhone, validatePhone } from "~~/shared/utils/phone";

export default defineEventHandler(async (event) => {
  const access = event.context.access;
  const memberId = Number(getRouterParam(event, "memberId"));
  if (!Number.isInteger(memberId) || memberId <= 0) {
    throw createError({ statusCode: 400, statusMessage: "Invalid member ID" });
  }
  const body = await readBody(event);

  const updates: Record<string, unknown> = {};
  if (body.name) updates.name = body.name.trim();
  if (body.phone !== undefined) {
    // Same rules as creating a member, so WhatsApp links keep working.
    const phoneErr = validatePhone(body.phone);
    if (phoneErr) throw createError({ statusCode: 400, statusMessage: phoneErr });
    updates.phone = body.phone?.trim() ? normalizePhone(body.phone) : null;
  }
  if (body.email !== undefined) updates.email = body.email?.trim() || null;
  if (body.status) {
    if (!["active", "inactive"].includes(body.status)) {
      throw createError({ statusCode: 400, statusMessage: "Status must be active or inactive" });
    }
    updates.status = body.status;
  }
  if (body.notes !== undefined) updates.notes = body.notes?.trim() || null;
  if (body.fatherName !== undefined) updates.fatherName = body.fatherName?.trim() || null;
  if (body.address !== undefined) updates.address = body.address?.trim() || null;
  if (body.batch !== undefined) updates.batch = body.batch?.trim() || null;

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

  return { member: rows[0] };
});
