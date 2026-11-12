/** Stop sending from the business's own number and forget its token. */
export default defineEventHandler(async (event) => {
  const access = event.context.access;
  requireOwner(access);
  await disconnectOwnAccount(access.orgId);
  return { ok: true };
});
