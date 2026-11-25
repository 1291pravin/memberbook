import { ORG_TYPES } from "../../../utils/org-setup";
import { eq } from "drizzle-orm";
import { parseOrgContact } from "../../../utils/org-contact";

export default defineEventHandler(async (event) => {
  const access = event.context.access;
  requireOwner(access);

  const body = await readBody(event);
  const { name, type, gracePeriodDays } = body;

  const updates: Record<string, unknown> = {};
  if (name) updates.name = name.trim();
  if (type) {
    if (!(ORG_TYPES as readonly string[]).includes(type)) {
      throw createError({ statusCode: 400, statusMessage: "Invalid organization type" });
    }
    updates.type = type;
  }
  if (gracePeriodDays !== undefined) {
    const days = Number(gracePeriodDays);
    if (!Number.isInteger(days) || days < 0) {
      throw createError({ statusCode: 400, statusMessage: "Grace period must be a non-negative integer" });
    }
    updates.gracePeriodDays = days;
  }

  if (body.ownerWhatsapp !== undefined) {
    try {
      updates.ownerWhatsapp = parseOrgContact(body.ownerWhatsapp || null, undefined).ownerWhatsapp;
    }
    catch (err) {
      throw createError({ statusCode: 400, statusMessage: (err as Error).message });
    }
  }
  if (body.gstin !== undefined) {
    const gstin = typeof body.gstin === "string" ? body.gstin.trim().toUpperCase() : "";
    // 15 characters: 2-digit state code, PAN, entity number, Z, check character.
    if (gstin && !/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gstin)) {
      throw createError({ statusCode: 400, statusMessage: "That doesn't look like a GSTIN. It has 15 characters, like 27ABCDE1234F1Z5." });
    }
    updates.gstin = gstin || null;
  }
  if (body.gstRate !== undefined) {
    const rate = Number(body.gstRate);
    if (![5, 12, 18, 28].includes(rate)) {
      throw createError({ statusCode: 400, statusMessage: "GST rate must be 5, 12, 18 or 28%" });
    }
    updates.gstRate = rate;
  }
  if (body.gstAddress !== undefined) {
    updates.gstAddress = typeof body.gstAddress === "string" && body.gstAddress.trim() ? body.gstAddress.trim().slice(0, 200) : null;
  }

  if (Object.keys(updates).length === 0) {
    throw createError({ statusCode: 400, statusMessage: "Nothing to update" });
  }

  await db
    .update(schema.organizations)
    .set(updates)
    .where(eq(schema.organizations.id, access.orgId));

  const rows = await db
    .select()
    .from(schema.organizations)
    .where(eq(schema.organizations.id, access.orgId))
    .limit(1);

  return { org: rows[0] };
});
