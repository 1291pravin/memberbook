import { and, eq, gte, sql } from "drizzle-orm";
import { db, schema } from "@nuxthub/db";

/** UTC ISO time of midnight IST on the 1st of the current IST month. */
export function monthStartIsoIST(): string {
  return new Date(`${monthStartIST()}T00:00:00+05:30`).toISOString();
}

/**
 * Reminders this business sent this month from MemberBook's shared number
 * (Meta bills us for these). Failed sends aren't billed, so they don't count.
 */
export async function sharedRemindersThisMonth(orgId: number): Promise<number> {
  const [row] = await db.select({ n: sql<number>`count(*)` }).from(schema.reminderLogs)
    .where(and(
      eq(schema.reminderLogs.orgId, orgId),
      eq(schema.reminderLogs.channel, "whatsapp_api"),
      eq(schema.reminderLogs.via, "memberbook"),
      sql`${schema.reminderLogs.status} != 'failed'`,
      gte(schema.reminderLogs.createdAt, monthStartIsoIST()),
    ));
  return Number(row?.n ?? 0);
}

/**
 * What automatic reminders did for a business since `sinceDate` (IST
 * YYYY-MM-DD): reminders sent, and fees recorded within 10 days after a
 * reminder for the same subscription. Shown during and after the free trial,
 * so the owner sees what the ₹199 earns them.
 */
export async function reminderResultsSince(orgId: number, sinceDate: string): Promise<{ sent: number; paidCount: number; paidAmount: number }> {
  const since = new Date(`${sinceDate}T00:00:00+05:30`).toISOString();
  const [sentRows, paidRows] = await Promise.all([
    db.all(sql`SELECT COUNT(*) AS n FROM reminder_logs
      WHERE org_id = ${orgId} AND channel = 'whatsapp_api' AND sent_by IS NULL
        AND kind != 'receipt' AND status != 'failed' AND created_at >= ${since}`),
    db.all(sql`SELECT COUNT(DISTINCT p.member_id) AS n, COALESCE(SUM(p.amount), 0) AS amount FROM payments p
      WHERE p.org_id = ${orgId} AND p.created_at >= ${since} AND p.subscription_id IS NOT NULL
        AND EXISTS (SELECT 1 FROM reminder_logs r
          WHERE r.org_id = p.org_id AND r.subscription_id = p.subscription_id
            AND r.channel = 'whatsapp_api' AND r.sent_by IS NULL AND r.kind != 'receipt' AND r.status != 'failed'
            AND r.created_at >= ${since} AND r.created_at <= p.created_at
            AND r.created_at >= strftime('%Y-%m-%dT%H:%M:%fZ', p.created_at, '-10 days'))`),
  ]);
  const s = (sentRows as { n: number }[])[0];
  const p = (paidRows as { n: number; amount: number }[])[0];
  return { sent: Number(s?.n ?? 0), paidCount: Number(p?.n ?? 0), paidAmount: Number(p?.amount ?? 0) };
}
