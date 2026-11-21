import { sql } from "drizzle-orm";

/** Admin inbox: email threads to support@memberbook.in, newest first. */
export default defineEventHandler(async (event) => {
  await requireAdminAccess(event);
  setHeader(event, "Cache-Control", "no-store");
  const rows = await db.all(sql`
    SELECT t.id, t.address, t.name, t.subject, t.mode,
      (SELECT m.body FROM email_messages m WHERE m.thread_id = t.id AND m.direction != 'note' ORDER BY m.id DESC LIMIT 1) AS last_body,
      (SELECT CASE WHEN m.direction = 'out' AND m.sent_by = 'ai' THEN 'ai' ELSE m.direction END FROM email_messages m WHERE m.thread_id = t.id AND m.direction != 'note' ORDER BY m.id DESC LIMIT 1) AS last_direction,
      (SELECT MAX(m.created_at) FROM email_messages m WHERE m.thread_id = t.id) AS last_at,
      (SELECT COUNT(*) FROM email_messages m WHERE m.thread_id = t.id AND m.direction = 'in' AND m.read_at IS NULL) AS unread
    FROM email_threads t
    ORDER BY last_at DESC
    LIMIT 100
  `) as { id: number; address: string; name: string | null; subject: string | null; mode: string; last_body: string | null; last_direction: string | null; last_at: string | null; unread: number }[];
  return {
    resendConfigured: !!useRuntimeConfig(event).resendApiKey,
    threads: rows.map(r => ({
      id: r.id,
      address: r.address,
      name: r.name,
      subject: r.subject,
      lastBody: (r.last_body ?? "").slice(0, 160),
      lastDirection: r.last_direction ?? "in",
      lastAt: r.last_at ?? "",
      unread: Number(r.unread),
      handedOver: r.mode === "human",
    })),
  };
});
