/** For the AI task: replace its notes about this contact (shown to the admin too). */
export default defineEventHandler(async (event) => {
  await requireAdminAccess(event);
  const phone = cleanPhone(getRouterParam(event, "phone"));
  const body = await readBody<{ notes?: unknown }>(event).catch(() => ({} as { notes?: unknown }));
  if (!phone) throw createError({ statusCode: 400, statusMessage: "Invalid phone" });
  const notes = typeof body?.notes === "string" ? body.notes.trim().slice(0, 2000) : "";
  await updateConversation(phone, { notes: notes || null });
  return { ok: true };
});
