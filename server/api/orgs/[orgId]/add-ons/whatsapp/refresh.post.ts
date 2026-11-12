/** "Check again": re-read the number and the reminder template's review status from Meta. */
export default defineEventHandler(async (event) => {
  const access = event.context.access;
  await requireAddOn(access.orgId, "own_number");
  const appUrl = String(useRuntimeConfig(event).public.appUrl || "https://memberbook.in").replace(/\/$/, "");
  const account = await refreshOwnAccount(access.orgId, appUrl);
  return { account: serializeOwnAccount(account) };
});
