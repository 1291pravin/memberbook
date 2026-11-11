import { eq } from "drizzle-orm";

interface StatusUpdate {
  id: string;
  status: "sent" | "delivered" | "read" | "failed";
  errors?: { code?: number; title?: string; message?: string }[];
}

const RANK: Record<string, number> = { sent: 1, delivered: 2, read: 3, failed: 4 };

// Delivery updates for reminders sent through the WhatsApp Cloud API.
// Incoming member messages are ignored for now (later: the AI front desk).
export default defineEventHandler(async (event) => {
  const raw = (await readRawBody(event, "utf8")) ?? "";
  if (!(await verifyMetaSignature(raw, getHeader(event, "x-hub-signature-256")))) {
    throw createError({ statusCode: 401, statusMessage: "Invalid signature" });
  }

  let payload: { entry?: { changes?: { value?: { statuses?: StatusUpdate[] } }[] }[] };
  try {
    payload = JSON.parse(raw);
  }
  catch {
    return { ok: true };
  }

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      for (const s of change.value?.statuses ?? []) {
        if (!s.id || !RANK[s.status]) continue;
        const [log] = await db.select({ id: schema.reminderLogs.id, status: schema.reminderLogs.status })
          .from(schema.reminderLogs)
          .where(eq(schema.reminderLogs.providerMessageId, s.id))
          .limit(1);
        // Webhooks can arrive out of order; never move a status backwards.
        if (!log || (RANK[log.status] ?? 0) >= RANK[s.status]!) continue;
        const err = s.errors?.[0];
        await db.update(schema.reminderLogs)
          .set({
            status: s.status,
            error: s.status === "failed" ? `${err?.code ?? ""} ${err?.title ?? err?.message ?? ""}`.trim().slice(0, 500) : null,
          })
          .where(eq(schema.reminderLogs.id, log.id));
      }
    }
  }
  return { ok: true };
});
