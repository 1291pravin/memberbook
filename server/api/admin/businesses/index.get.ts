/**
 * Businesses board: every business with its health, owner, usage, money and
 * our CRM stage. Test/demo businesses are left out unless `?all=1`.
 */
export default defineEventHandler(async (event) => {
  await requireAdminAccess(event);
  const includeTest = getQuery(event).all === "1";

  const all = await getBusinessRows();
  const rows = includeTest ? all : all.filter(r => !r.isTest);

  const counts: Record<string, number> = {};
  for (const r of rows) counts[r.health] = (counts[r.health] ?? 0) + 1;

  return {
    businesses: rows,
    counts,
    testCount: all.filter(r => r.isTest).length,
    stages: ADMIN_STAGES,
  };
});
