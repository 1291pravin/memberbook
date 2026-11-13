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
