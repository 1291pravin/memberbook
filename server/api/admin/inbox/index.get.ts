import { sql } from "drizzle-orm";

interface InboxRow {
  phone: string;
  contact_name: string | null;
  last_body: string;
  last_direction: string;
  last_at: string;
  last_in_at: string | null;
  unread: number;
}

// Conversations in the WhatsApp inbox, newest first, with unread counts.
export default defineEventHandler(async (event) => {
  await requireAdminAccess(event);

  const rows = await db.all(sql`
    SELECT
      m.phone,
      (SELECT contact_name FROM whatsapp_messages c WHERE c.phone = m.phone AND c.contact_name IS NOT NULL ORDER BY c.created_at DESC LIMIT 1) AS contact_name,
      (SELECT body FROM whatsapp_messages l WHERE l.phone = m.phone ORDER BY l.created_at DESC, l.id DESC LIMIT 1) AS last_body,
      (SELECT direction FROM whatsapp_messages l WHERE l.phone = m.phone ORDER BY l.created_at DESC, l.id DESC LIMIT 1) AS last_direction,
      MAX(m.created_at) AS last_at,
      MAX(CASE WHEN m.direction = 'in' THEN m.created_at END) AS last_in_at,
      SUM(CASE WHEN m.direction = 'in' AND m.read_at IS NULL THEN 1 ELSE 0 END) AS unread
    FROM whatsapp_messages m
    GROUP BY m.phone
    ORDER BY last_at DESC
    LIMIT 200
  `);

  return {
    canSend: canSendWhatsAppCloud(),
    conversations: (rows as InboxRow[]).map(r => ({
      phone: r.phone,
      name: r.contact_name,
      lastBody: r.last_body,
      lastDirection: r.last_direction,
      lastAt: r.last_at,
      lastInAt: r.last_in_at,
      unread: Number(r.unread ?? 0),
    })),
  };
});
