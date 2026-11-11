import { eq } from "drizzle-orm";

interface StatusUpdate {
  id: string;
  status: "sent" | "delivered" | "read" | "failed";
  errors?: { code?: number; title?: string; message?: string }[];
}

interface WebhookValue {
  contacts?: { wa_id?: string; profile?: { name?: string } }[];
  messages?: IncomingWhatsAppMessage[];
  statuses?: StatusUpdate[];
}

const RANK: Record<string, number> = { sent: 1, delivered: 2, read: 3, failed: 4 };

// Meta WhatsApp Cloud API webhook:
// - delivery updates for reminders and inbox replies we sent
// - incoming messages, saved to the admin inbox with an email alert
export default defineEventHandler(async (event) => {
  const raw = (await readRawBody(event, "utf8")) ?? "";
  if (!(await verifyMetaSignature(raw, getHeader(event, "x-hub-signature-256")))) {
    throw createError({ statusCode: 401, statusMessage: "Invalid signature" });
  }

  let payload: { entry?: { changes?: { value?: WebhookValue }[] }[] };
  try {
    payload = JSON.parse(raw);
  }
  catch {
    return { ok: true };
  }

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value ?? {};

      for (const m of value.messages ?? []) {
        if (!m.id || !m.from) continue;
        const phone = String(m.from).replace(/\D/g, "");
        const contact = value.contacts?.find(c => c.wa_id === m.from) ?? value.contacts?.[0];
        const name = contact?.profile?.name?.slice(0, 100) ?? null;
        const body = describeIncomingMessage(m).slice(0, 4000);
        const createdAt = m.timestamp ? new Date(Number(m.timestamp) * 1000).toISOString() : new Date().toISOString();
        // Meta retries webhooks, so the unique wa_message_id makes this idempotent.
        const inserted = await db.insert(schema.whatsappMessages)
          .values({ waMessageId: m.id, direction: "in", phone, contactName: name, type: String(m.type ?? "unknown"), body, status: "received", createdAt })
          .onConflictDoNothing()
          .returning({ id: schema.whatsappMessages.id });
        if (inserted.length && m.type !== "reaction") {
          await sendInboxAlert(event, { phone, name, body });
        }
      }

      for (const s of value.statuses ?? []) {
        if (!s.id || !RANK[s.status]) continue;
        const err = s.errors?.[0];
        const errorText = s.status === "failed" ? `${err?.code ?? ""} ${err?.title ?? err?.message ?? ""}`.trim().slice(0, 500) : null;

        const [log] = await db.select({ id: schema.reminderLogs.id, status: schema.reminderLogs.status })
          .from(schema.reminderLogs)
          .where(eq(schema.reminderLogs.providerMessageId, s.id))
          .limit(1);
        // Webhooks can arrive out of order; never move a status backwards.
        if (log && (RANK[log.status] ?? 0) < RANK[s.status]!) {
          await db.update(schema.reminderLogs)
            .set({ status: s.status, error: errorText })
            .where(eq(schema.reminderLogs.id, log.id));
        }

        const [msg] = await db.select({ id: schema.whatsappMessages.id, status: schema.whatsappMessages.status })
          .from(schema.whatsappMessages)
          .where(eq(schema.whatsappMessages.waMessageId, s.id))
          .limit(1);
        if (msg && (RANK[msg.status] ?? 0) < RANK[s.status]!) {
          await db.update(schema.whatsappMessages)
            .set({ status: s.status, error: errorText })
            .where(eq(schema.whatsappMessages.id, msg.id));
        }
      }
    }
  }
  return { ok: true };
});
