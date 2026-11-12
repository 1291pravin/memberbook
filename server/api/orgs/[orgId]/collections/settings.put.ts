import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  const access = event.context.access;
  requireOwner(access);
  const body = await readBody(event) ?? {};

  const updates: Partial<typeof schema.organizations.$inferInsert> = {};

  if (body.upiId !== undefined) {
    const upiId = typeof body.upiId === "string" ? body.upiId.trim() : "";
    if (upiId && !UPI_ID_PATTERN.test(upiId)) {
      throw createError({ statusCode: 400, statusMessage: "That doesn't look like a UPI ID. It should look like name@bank, e.g. 9876543210@ybl." });
    }
    updates.upiId = upiId || null;
  }
  if (body.upiPayeeName !== undefined) {
    const name = typeof body.upiPayeeName === "string" ? body.upiPayeeName.trim().slice(0, 50) : "";
    updates.upiPayeeName = name || null;
  }
  if (body.reminderDaysBefore !== undefined) {
    const days = Number(body.reminderDaysBefore);
    if (!Number.isInteger(days) || days < 0 || days > 15) {
      throw createError({ statusCode: 400, statusMessage: "Reminder days must be between 0 and 15" });
    }
    updates.reminderDaysBefore = days;
  }
  if (body.autoRemindersEnabled !== undefined) {
    const on = body.autoRemindersEnabled === true;
    if (on) {
      if (!(await reminderSending(access.orgId)).available) {
        throw createError({ statusCode: 400, statusMessage: "Automatic WhatsApp reminders are not available yet." });
      }
      const current = await getOrgCollectionSettings(access.orgId);
      const upiId = updates.upiId !== undefined ? updates.upiId : current?.upiId;
      if (!upiId) {
        throw createError({ statusCode: 400, statusMessage: "Add your UPI ID first, so every reminder has a pay link." });
      }
    }
    updates.autoRemindersEnabled = on;
  }

  if (Object.keys(updates).length === 0) {
    throw createError({ statusCode: 400, statusMessage: "Nothing to update" });
  }

  await db.update(schema.organizations).set(updates).where(eq(schema.organizations.id, access.orgId));
  return { ok: true };
});
