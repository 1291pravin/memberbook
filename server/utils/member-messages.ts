import { and, desc, eq, gte, inArray, isNotNull, sql } from "drizzle-orm";
import { db, schema } from "@nuxthub/db";

/**
 * Birthday wishes and "we miss you" notes, sent by the daily reminders task as
 * part of automatic reminders (the ₹199 plan). Only from MemberBook's number,
 * only once Meta has approved the templates, and each one counts toward the
 * business's monthly allowance like a reminder.
 */

/** A member who hasn't checked in for this many days gets a "we miss you". */
export const MISS_YOU_AFTER_DAYS = 7;
/** ...unless the last visit is older than this (they've likely left; reminders handle renewals). */
export const MISS_YOU_MAX_DAYS = 45;
/** At most one "we miss you" per member in this many days. */
export const MISS_YOU_GAP_DAYS = 30;
/** Per business per day, so one morning never eats the month's allowance. */
const MISS_YOU_DAILY_MAX = 15;

interface Candidate {
  memberId: number;
  name: string;
  phone: string | null;
  subscriptionId: number;
  daysAway?: number;
}

/** Latest subscription per member (reminder_logs needs one), for the given members. */
async function latestSubscriptions(orgId: number, memberIds: number[]): Promise<Map<number, { id: number; endDate: string; status: string }>> {
  const map = new Map<number, { id: number; endDate: string; status: string }>();
  if (memberIds.length === 0) return map;
  const rows = await db.select({
    id: schema.memberSubscriptions.id,
    memberId: schema.memberSubscriptions.memberId,
    endDate: schema.memberSubscriptions.endDate,
    status: schema.memberSubscriptions.status,
  })
    .from(schema.memberSubscriptions)
    .where(and(eq(schema.memberSubscriptions.orgId, orgId), inArray(schema.memberSubscriptions.memberId, memberIds)))
    .orderBy(desc(schema.memberSubscriptions.endDate));
  for (const r of rows) if (!map.has(r.memberId)) map.set(r.memberId, r);
  return map;
}

/** Members whose birthday is today (IST) and who haven't had a wish in the last 300 days. */
export async function birthdayCandidates(orgId: number): Promise<Candidate[]> {
  const mmdd = todayIST().slice(5);
  const rows = await db.select({ id: schema.members.id, name: schema.members.name, phone: schema.members.phone })
    .from(schema.members)
    .where(and(
      eq(schema.members.orgId, orgId),
      eq(schema.members.status, "active"),
      isNotNull(schema.members.birthDate),
      sql`substr(${schema.members.birthDate}, 6, 5) = ${mmdd}`,
    ))
    .limit(100);
  if (rows.length === 0) return [];
  const since = new Date(Date.now() - 300 * 86400000).toISOString();
  const already = await db.select({ memberId: schema.reminderLogs.memberId }).from(schema.reminderLogs)
    .where(and(
      eq(schema.reminderLogs.orgId, orgId),
      eq(schema.reminderLogs.kind, "birthday"),
      sql`${schema.reminderLogs.status} != 'failed'`,
      gte(schema.reminderLogs.createdAt, since),
    ));
  const done = new Set(already.map(r => r.memberId));
  const subs = await latestSubscriptions(orgId, rows.map(r => r.id));
  return rows
    .filter(r => !done.has(r.id) && subs.has(r.id))
    .map(r => ({ memberId: r.id, name: r.name, phone: r.phone, subscriptionId: subs.get(r.id)!.id }));
}

/**
 * Paid-up members (current subscription active and fully paid) whose last
 * check-in was MISS_YOU_AFTER_DAYS to MISS_YOU_MAX_DAYS days ago. Only for
 * businesses that record check-ins every day (some in the last 3 days), so a
 * business that stopped using check-ins doesn't message everyone.
 */
export async function missYouCandidates(orgId: number): Promise<Candidate[]> {
  const now = Date.now();
  const recent = await db.select({ n: sql<number>`count(*)` }).from(schema.checkIns)
    .where(and(eq(schema.checkIns.orgId, orgId), gte(schema.checkIns.checkedInAt, new Date(now - 3 * 86400000).toISOString())));
  if (Number(recent[0]?.n ?? 0) < 3) return [];

  const last = await db.select({
    memberId: schema.checkIns.memberId,
    lastAt: sql<string>`max(${schema.checkIns.checkedInAt})`,
  })
    .from(schema.checkIns)
    .where(and(eq(schema.checkIns.orgId, orgId), gte(schema.checkIns.checkedInAt, new Date(now - MISS_YOU_MAX_DAYS * 86400000).toISOString())))
    .groupBy(schema.checkIns.memberId);
  const away = last
    .map(r => ({ memberId: r.memberId, days: Math.floor((now - new Date(r.lastAt).getTime()) / 86400000) }))
    .filter(r => r.days >= MISS_YOU_AFTER_DAYS && r.days <= MISS_YOU_MAX_DAYS);
  if (away.length === 0) return [];

  const ids = away.map(a => a.memberId).slice(0, 300);
  const [members, subs, sentRecently] = await Promise.all([
    db.select({ id: schema.members.id, name: schema.members.name, phone: schema.members.phone, status: schema.members.status })
      .from(schema.members).where(and(eq(schema.members.orgId, orgId), inArray(schema.members.id, ids))),
    db.select({
      id: schema.memberSubscriptions.id,
      memberId: schema.memberSubscriptions.memberId,
      paymentStatus: schema.memberSubscriptions.paymentStatus,
    })
      .from(schema.memberSubscriptions)
      .where(and(
        eq(schema.memberSubscriptions.orgId, orgId),
        inArray(schema.memberSubscriptions.memberId, ids),
        eq(schema.memberSubscriptions.status, "active"),
        sql`${schema.memberSubscriptions.startDate} <= ${todayIST()}`,
        sql`${schema.memberSubscriptions.endDate} >= ${todayIST()}`,
      )),
    db.select({ memberId: schema.reminderLogs.memberId }).from(schema.reminderLogs)
      .where(and(
        eq(schema.reminderLogs.orgId, orgId),
        eq(schema.reminderLogs.kind, "miss_you"),
        gte(schema.reminderLogs.createdAt, new Date(now - MISS_YOU_GAP_DAYS * 86400000).toISOString()),
      )),
  ]);
  const paid = new Map(subs.filter(s => s.paymentStatus === "paid").map(s => [s.memberId, s.id]));
  const recentSet = new Set(sentRecently.map(r => r.memberId));
  const daysBy = new Map(away.map(a => [a.memberId, a.days]));
  return members
    .filter(m => m.status === "active" && paid.has(m.id) && !recentSet.has(m.id))
    .map(m => ({ memberId: m.id, name: m.name, phone: m.phone, subscriptionId: paid.get(m.id)!, daysAway: daysBy.get(m.id) }))
    .slice(0, MISS_YOU_DAILY_MAX);
}

/**
 * Send today's birthday wishes and miss-you notes for one business, up to `cap`
 * messages. Returns how many went out.
 */
export async function sendMemberMessages(org: { id: number; name: string; type: string; birthdayWishes: boolean; missYouMessages: boolean }, cap: number): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;
  if (cap <= 0) return { sent, failed };

  const [birthdayOk, missYouOk] = await Promise.all([
    org.birthdayWishes ? sharedTemplateStatus(BIRTHDAY_TEMPLATE_NAME).then(s => s === "APPROVED") : false,
    org.missYouMessages ? sharedTemplateStatus(MISS_YOU_TEMPLATE_NAME).then(s => s === "APPROVED") : false,
  ]);

  const jobs: { kind: "birthday" | "miss_you"; c: Candidate }[] = [];
  if (birthdayOk) for (const c of await birthdayCandidates(org.id)) jobs.push({ kind: "birthday", c });
  if (missYouOk) for (const c of await missYouCandidates(org.id)) jobs.push({ kind: "miss_you", c });

  for (const { kind, c } of jobs) {
    if (sent >= cap) break;
    const to = normalizeIndianPhone(c.phone);
    if (!to) continue;
    const result = kind === "birthday"
      ? await sendSimpleTemplate(BIRTHDAY_TEMPLATE_NAME, to, [firstName(c.name), org.name, businessEmoji(org.type)])
      : await sendSimpleTemplate(MISS_YOU_TEMPLATE_NAME, to, [firstName(c.name), org.name, String(c.daysAway ?? MISS_YOU_AFTER_DAYS)]);
    await logReminder({
      orgId: org.id,
      memberId: c.memberId,
      subscriptionId: c.subscriptionId,
      kind,
      channel: "whatsapp_api",
      status: result.ok ? "sent" : "failed",
      amount: 0,
      providerMessageId: result.messageId ?? null,
      error: result.error ?? null,
      sentBy: null,
      via: "memberbook",
    });
    if (result.ok) sent++;
    else failed++;
  }
  return { sent, failed };
}
