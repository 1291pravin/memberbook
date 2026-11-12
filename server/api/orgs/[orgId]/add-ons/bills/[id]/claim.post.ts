import { and, eq, inArray } from "drizzle-orm";

/** Owner paid a bill by UPI and enters the UPI reference (UTR) so we can check it. */
export default defineEventHandler(async (event) => {
  const access = event.context.access;
  requireOwner(access);
  const id = Number(getRouterParam(event, "id"));
  const body = await readBody<{ upiRef?: string }>(event);
  const upiRef = String(body?.upiRef || "").replace(/\s+/g, "").slice(0, 40);
  if (!/^[A-Za-z0-9]{6,40}$/.test(upiRef)) {
    throw createError({ statusCode: 400, statusMessage: "Enter the UPI reference number from your payment app (usually 12 digits)" });
  }

  const now = new Date().toISOString();
  const updated = await db.update(schema.addOnBills)
    .set({ status: "claimed", upiRef, claimedAt: now, updatedAt: now })
    .where(and(eq(schema.addOnBills.id, id), eq(schema.addOnBills.orgId, access.orgId), inArray(schema.addOnBills.status, ["due", "claimed"])))
    .returning({ id: schema.addOnBills.id });
  if (!updated.length) throw createError({ statusCode: 404, statusMessage: "Bill not found" });

  await sendAdminEmail(event, `Add-on bill paid? Check UPI ref ${upiRef}`, `Business ${access.orgId} says they paid bill #${id}. UPI reference: ${upiRef}.\nVerify it on /admin/services.`);
  return { ok: true };
});
