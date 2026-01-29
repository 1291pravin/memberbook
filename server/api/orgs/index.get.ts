export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const orgs = await getUserOrgs(user.id);
  return { orgs };
});
