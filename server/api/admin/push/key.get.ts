/** Public VAPID key the admin's phone needs to turn on inbox alerts. */
export default defineEventHandler(async (event) => {
  await requireAdminAccess(event);
  const keys = await getVapidKeys();
  return { publicKey: keys.publicKey };
});
