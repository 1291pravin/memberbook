import { and, eq, inArray } from "drizzle-orm";
import type { UploadFile } from "../../../../utils/data-uploads";

/**
 * For the AI task: hand the files someone sent in this chat (register photos,
 * Excel, PDF) and/or a typed list to the loader for the business set up in
 * this chat. It becomes a normal upload on /admin/setup and starts the loader.
 */
export default defineEventHandler(async (event) => {
  await requireAdminAccess(event);
  const phone = cleanPhone(getRouterParam(event, "phone"));
  const body = await readBody<{ messageIds?: unknown; text?: unknown; note?: unknown }>(event).catch(() => ({} as Record<string, unknown>));
  if (!phone) throw createError({ statusCode: 400, statusMessage: "Invalid phone" });

  const conv = await getConversation(phone);
  const orgId = await setupOrgForChat(phone, conv);
  if (!orgId) throw createError({ statusCode: 409, statusMessage: "No business set up in this chat yet. Use /setup first." });

  const ids = Array.isArray(body?.messageIds) ? [...new Set(body.messageIds.map(Number).filter(Number.isInteger))] : [];
  if (ids.length > MAX_UPLOAD_FILES) throw createError({ statusCode: 400, statusMessage: `At most ${MAX_UPLOAD_FILES} files per load; split them into several loads` });
  const text = typeof body?.text === "string" ? body.text.trim().slice(0, MAX_UPLOAD_TEXT) : "";
  const note = typeof body?.note === "string" ? body.note.trim().slice(0, 1000) : "";

  const files: UploadFile[] = [];
  if (ids.length) {
    // Only this contact's own incoming files.
    const rows = await db.select({ id: schema.whatsappMessages.id, media: schema.whatsappMessages.media })
      .from(schema.whatsappMessages)
      .where(and(eq(schema.whatsappMessages.phone, phone), eq(schema.whatsappMessages.direction, "in"), inArray(schema.whatsappMessages.id, ids)));
    for (const id of ids) {
      const row = rows.find(r => r.id === id);
      if (!row?.media) throw createError({ statusCode: 400, statusMessage: `Message ${id} is not a file they sent in this chat` });
      const m = JSON.parse(row.media) as { key?: string; name?: string; type?: string; size?: number };
      if (!m.key) throw createError({ statusCode: 409, statusMessage: `The file in message ${id} wasn't saved. Ask them to send it again.` });
      if (String(m.type).startsWith("audio/") || String(m.type).startsWith("video/")) {
        throw createError({ statusCode: 400, statusMessage: `Message ${id} is a voice note or video; the loader reads photos, PDF, Excel, CSV and text only` });
      }
      files.push({ key: m.key, name: String(m.name ?? "file").slice(0, 200), type: String(m.type ?? ""), size: Number(m.size ?? 0) });
    }
  }
  if (!files.length && !text) throw createError({ statusCode: 400, statusMessage: "Give messageIds of their files and/or text" });

  const [upload] = await db.insert(schema.dataUploads).values({
    orgId: orgId,
    uploadedBy: null,
    source: "admin",
    files: JSON.stringify(files),
    text: text || null,
    note: `Sent on WhatsApp by +${phone}.${note ? ` ${note}` : ""}`.slice(0, 1000),
  }).returning();

  wakeAiRunSoon(event, "uploads", `upload #${upload!.id} from WhatsApp for business ${orgId}`);
  await addInboxNote(phone, `AI sent ${files.length} file(s)${text ? " and a typed list" : ""} to the loader (upload #${upload!.id})`, "ai");
  await recordAdminAuditLog(event, "inbox_ai_upload", { targetOrgId: orgId, metadata: { phone, uploadId: upload!.id } });
  return { uploadId: upload!.id, status: upload!.status };
});
