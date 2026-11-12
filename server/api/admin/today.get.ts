/** Everything for the admin Today page: to-dos, headline numbers and the last 48 hours. */
export default defineEventHandler(async (event) => {
  await requireAdminAccess(event);
  return await getAdminToday();
});
