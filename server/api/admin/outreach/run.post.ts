/** Run today's outreach batch now (same rules and daily cap as the 09:00 IST task). Optional { limit }. */
export default defineEventHandler(async (event) => {
  await requireAdminAccess(event);
  const body = await readBody<{ limit?: unknown }>(event).catch(() => ({} as { limit?: unknown }));
  const limit = body?.limit === undefined ? undefined : Math.max(0, Math.floor(Number(body.limit) || 0));
  const result = await runOutreachBatch({ limit });
  await recordAdminAuditLog(event, "outreach_run", { metadata: result });
  return result;
});
