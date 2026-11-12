/** One business's add-ons, for the admin's switches. */
export default defineEventHandler(async (event) => {
  await requireAdminAccess(event);
  const orgId = Number(getRouterParam(event, "orgId"));
  if (!Number.isInteger(orgId) || orgId <= 0) throw createError({ statusCode: 400, statusMessage: "Invalid business" });
  return getOrgAddOnStates(orgId);
});
