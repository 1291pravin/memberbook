/** Make a new door QR link (the old poster stops working). Owner only. */
export default defineEventHandler(async (event) => {
  const access = event.context.access;
  requireOwner(access);
  await requireAddOn(access.orgId, "self_check_in");
  await ensureCheckInToken(access.orgId, true);
  return { ok: true };
});
