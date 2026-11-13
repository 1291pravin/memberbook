import { and, eq, gte, lt, sql } from "drizzle-orm";
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

/** An add-on bill left unpaid (not even claimed) past the grace period. */
export async function hasOverdueAddOnBill(orgId: number): Promise<boolean> {
  const cutoff = new Date(Date.now() - REMINDER_BILL_GRACE_DAYS * 86400000).toISOString();
  const [row] = await db.select({ id: schema.addOnBills.id }).from(schema.addOnBills)
    .where(and(
      eq(schema.addOnBills.orgId, orgId),
      eq(schema.addOnBills.status, "due"),
      lt(schema.addOnBills.createdAt, cutoff),
    )).limit(1);
  return Boolean(row);
}
