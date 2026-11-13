import { eq } from "drizzle-orm";

/** Admin marks a bill paid (after checking the UPI reference), waives it, or reopens it. */
export default defineEventHandler(async (event) => {
  await requireAdminAccess(event);
  const id = Number(getRouterParam(event, "id"));
  const body = await readBody<{ action?: string }>(event);
  const now = new Date().toISOString();
  const set = body?.action === "verify"
    ? { status: "paid", paidAt: now }
    : body?.action === "waive"
      ? { status: "waived", paidAt: null }
      : body?.action === "reopen"
        ? { status: "due", paidAt: null, upiRef: null, claimedAt: null }
        : null;
  if (!set) throw createError({ statusCode: 400, statusMessage: "action must be verify, waive or reopen" });
  const updated = await db.update(schema.addOnBills).set({ ...set, updatedAt: now })
    .where(eq(schema.addOnBills.id, id)).returning({ id: schema.addOnBills.id });
  if (!updated.length) throw createError({ statusCode: 404, statusMessage: "Bill not found" });
  // Paying (or waiving) a prepaid bill switches on that add-on for its period.
  if (body?.action === "verify" || body?.action === "waive") await applyPrepaidBill(id);
  return { ok: true };
});
