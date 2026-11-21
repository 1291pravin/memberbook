/** For the AI task: replace its notes about this email contact (shown to the admin too). */
export default defineEventHandler(async (event) => {
  await requireAdminAccess(event);
  const id = Number(getRouterParam(event, "id"));
  const thread = Number.isInteger(id) ? await getThread(id) : null;
  if (!thread) throw createError({ statusCode: 404, statusMessage: "No such email thread" });
  const body = await readBody<{ notes?: unknown }>(event).catch(() => ({} as { notes?: unknown }));
  const notes = typeof body?.notes === "string" ? body.notes.trim().slice(0, 2000) : "";
  await updateThread(id, { notes: notes || null });
  return { ok: true };
});
