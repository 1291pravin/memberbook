export default defineEventHandler(async (event) => {
  const access = event.context.access;
  requireOwner(access);

  const storage = useStorage("cache");
  const allKeys = await storage.getKeys("nitro:handlers");
  const orgKeys = allKeys.filter((key) => key.includes(`org${access.orgId}`));
  await Promise.all(orgKeys.map((key) => storage.removeItem(key)));

  return { cleared: orgKeys.length };
});
