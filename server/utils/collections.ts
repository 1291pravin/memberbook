import { and, eq, inArray, sql } from "drizzle-orm";
import { db, schema } from "@nuxthub/db";
import type { WhatsAppSender } from "./whatsapp-cloud";

/** Renewals that lapsed longer ago than this are treated as churned, not chased. */
export const LAPSED_WINDOW_DAYS = 30;
/** Automatic reminders stop after this many per subscription; the owner follows up by hand. */
export const MAX_AUTO_REMINDERS = 3;
/** Minimum days between two automatic reminders for the same subscription. */
export const AUTO_REMINDER_GAP_DAYS = 3;

export type CollectionKind = "due" | "renewal";

export interface CollectionItem {
  key: string;
  kind: CollectionKind;
  memberId: number;
  memberName: string;
  memberPhone: string | null;
  subscriptionId: number;
  planName: string;
  amount: number; // paise
  /** renewal: the last day of the current period; due: the period's start date */
  dueDate: string;
  /** Days past dueDate (negative = still upcoming). */
  daysLate: number;
  overdue: boolean;
  remindersSent: number;
  lastRemindedAt: string | null;
  /** Includes failed sends, so automatic retries keep their gap. */
  lastAttemptAt: string | null;
  claimedAt: string | null;
  payToken: string | null;
}

export interface OrgCollectionSettings {
  id: number;
  name: string;
  type: string;
  upiId: string | null;
  upiPayeeName: string | null;
  autoRemindersEnabled: boolean;
  reminderDaysBefore: number;
}

export async function getOrgCollectionSettings(orgId: number): Promise<OrgCollectionSettings | null> {
  const [org] = await db
    .select({
      id: schema.organizations.id,
      name: schema.organizations.name,
      type: schema.organizations.type,
      upiId: schema.organizations.upiId,
      upiPayeeName: schema.organizations.upiPayeeName,
      autoRemindersEnabled: schema.organizations.autoRemindersEnabled,
      reminderDaysBefore: schema.organizations.reminderDaysBefore,
    })
    .from(schema.organizations)
    .where(eq(schema.organizations.id, orgId))
    .limit(1);
  return org ?? null;
}

function daysBetween(from: string, to: string): number {
  const [fy, fm, fd] = from.split("-").map(Number);
  const [ty, tm, td] = to.split("-").map(Number);
  return Math.round((Date.UTC(ty!, tm! - 1, td!) - Date.UTC(fy!, fm! - 1, fd!)) / 86400000);
}

/**
 * Everyone who owes this org money right now, plus renewals coming up in the
 * next `daysBefore` days. Only active members are included.
 *
 * - "due": a non-cancelled subscription (started on or before today) with an unpaid balance.
 * - "renewal": the member's latest subscription is fully paid and ends within
 *   `daysBefore` days, or ended in the last LAPSED_WINDOW_DAYS days without a renewal.
 */
export async function getCollections(orgId: number, daysBefore: number): Promise<CollectionItem[]> {
  const today = todayIST();
  const horizon = addDaysToDate(today, daysBefore);
  const lapsedCutoff = addDaysToDate(today, -LAPSED_WINDOW_DAYS);
  const oldestDue = addDaysToDate(today, -90);

  const [dueRows, renewalRows] = await Promise.all([
    db.all<{
      subscription_id: number; member_id: number; member_name: string; member_phone: string | null;
      plan_name: string; start_date: string; pending: number;
    }>(sql`
      SELECT ms.id AS subscription_id, m.id AS member_id, m.name AS member_name, m.phone AS member_phone,
        sp.name AS plan_name, ms.start_date,
        ms.amount - COALESCE((SELECT SUM(p.amount) FROM payments p
          WHERE p.subscription_id = ms.id AND p.org_id = ms.org_id), 0) AS pending
      FROM member_subscriptions ms
      JOIN members m ON m.id = ms.member_id AND m.org_id = ms.org_id
      JOIN subscription_plans sp ON sp.id = ms.plan_id
      WHERE ms.org_id = ${orgId}
        AND ms.status != 'cancelled'
        AND m.status = 'active'
        AND ms.start_date <= ${today}
        AND ms.end_date >= ${oldestDue}
      GROUP BY ms.id
      HAVING pending > 0
    `),
    db.all<{
      subscription_id: number; member_id: number; member_name: string; member_phone: string | null;
      plan_name: string; plan_price: number; plan_active: number; amount: number; end_date: string;
    }>(sql`
      SELECT ms.id AS subscription_id, m.id AS member_id, m.name AS member_name, m.phone AS member_phone,
        sp.name AS plan_name, sp.price AS plan_price, sp.active AS plan_active, ms.amount, ms.end_date
      FROM member_subscriptions ms
      JOIN members m ON m.id = ms.member_id AND m.org_id = ms.org_id
      JOIN subscription_plans sp ON sp.id = ms.plan_id
      WHERE ms.org_id = ${orgId}
        AND ms.status != 'cancelled'
        AND m.status = 'active'
        AND ms.amount <= COALESCE((SELECT SUM(p.amount) FROM payments p
          WHERE p.subscription_id = ms.id AND p.org_id = ms.org_id), 0)
        AND ms.end_date BETWEEN ${lapsedCutoff} AND ${horizon}
        AND ms.id = (
          SELECT MAX(ms2.id) FROM member_subscriptions ms2
          WHERE ms2.member_id = ms.member_id AND ms2.org_id = ms.org_id AND ms2.status != 'cancelled'
        )
    `),
  ]);

  const items: CollectionItem[] = [];
  for (const r of dueRows) {
    const daysLate = daysBetween(r.start_date, today);
    items.push({
      key: `due:${r.subscription_id}`,
      kind: "due",
      memberId: r.member_id,
      memberName: r.member_name,
      memberPhone: r.member_phone,
      subscriptionId: r.subscription_id,
      planName: r.plan_name,
      amount: Number(r.pending),
      dueDate: r.start_date,
      daysLate,
      overdue: true,
      remindersSent: 0,
      lastRemindedAt: null,
      lastAttemptAt: null,
      claimedAt: null,
      payToken: null,
    });
  }
  for (const r of renewalRows) {
    const amount = r.plan_active && r.plan_price > 0 ? Number(r.plan_price) : Number(r.amount);
    if (amount <= 0) continue; // free plans have nothing to collect
    const daysLate = daysBetween(r.end_date, today);
    items.push({
      key: `renewal:${r.subscription_id}`,
      kind: "renewal",
      memberId: r.member_id,
      memberName: r.member_name,
      memberPhone: r.member_phone,
      subscriptionId: r.subscription_id,
      planName: r.plan_name,
      // Renew at today's plan price; fall back to what they paid last time.
      amount,
      dueDate: r.end_date,
      daysLate,
      // The last day of the period is still paid for; it's overdue from the day after.
      overdue: daysLate > 0,
      remindersSent: 0,
      lastRemindedAt: null,
      lastAttemptAt: null,
      claimedAt: null,
      payToken: null,
    });
  }

  if (items.length === 0) return items;

  const subscriptionIds = [...new Set(items.map(i => i.subscriptionId))];
  const [logRows, linkRows] = await Promise.all([
    selectInChunks(subscriptionIds, ids => db
      .select({
        subscriptionId: schema.reminderLogs.subscriptionId,
        kind: schema.reminderLogs.kind,
        count: sql<number>`SUM(CASE WHEN ${schema.reminderLogs.status} != 'failed' THEN 1 ELSE 0 END)`,
        last: sql<string | null>`MAX(CASE WHEN ${schema.reminderLogs.status} != 'failed' THEN ${schema.reminderLogs.createdAt} END)`,
        lastAttempt: sql<string>`MAX(${schema.reminderLogs.createdAt})`,
      })
      .from(schema.reminderLogs)
      .where(and(
        eq(schema.reminderLogs.orgId, orgId),
        inArray(schema.reminderLogs.subscriptionId, ids),
      ))
      .groupBy(schema.reminderLogs.subscriptionId, schema.reminderLogs.kind)),
    selectInChunks(subscriptionIds, ids => db
      .select()
      .from(schema.paymentLinks)
      .where(and(
        eq(schema.paymentLinks.orgId, orgId),
        inArray(schema.paymentLinks.subscriptionId, ids),
      ))),
  ]);

  const logsByKey = new Map(logRows.map(l => [`${l.kind}:${l.subscriptionId}`, l]));
  const linksByKey = new Map(linkRows.map(l => [`${l.kind}:${l.subscriptionId}`, l]));

  for (const item of items) {
    const log = logsByKey.get(item.key);
    if (log) {
      item.remindersSent = Number(log.count ?? 0);
      item.lastRemindedAt = log.last;
      item.lastAttemptAt = log.lastAttempt;
    }
    const link = linksByKey.get(item.key);
    if (link && link.status === "open") {
      item.payToken = link.token;
      item.claimedAt = link.claimedAt;
    }
  }

  // Overdue first (most late at the top), then upcoming renewals soonest first.
  items.sort((a, b) => Number(b.overdue) - Number(a.overdue) || b.daysLate - a.daysLate);
  return items;
}

// D1 allows at most 100 bound parameters per statement.
async function selectInChunks<I, T>(ids: I[], run: (chunk: I[]) => Promise<T[]>): Promise<T[]> {
  const out: T[] = [];
  for (let i = 0; i < ids.length; i += 90) {
    out.push(...await run(ids.slice(i, i + 90)));
  }
  return out;
}

export function generateToken(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Make sure every item has an open pay link with the current amount, and fill
 * in item.payToken. A link that was marked paid is reopened if money is owed again.
 */
export async function ensurePaymentLinks(orgId: number, items: CollectionItem[]): Promise<void> {
  const now = new Date().toISOString();
  const missing = items.filter(i => !i.payToken);
  if (missing.length > 0) {
    // Links for these may exist with status "paid" (e.g. a payment was later deleted);
    // reopen them rather than inserting duplicates.
    const ids = [...new Set(missing.map(i => i.subscriptionId))];
    const existing = await selectInChunks(ids, chunk => db
      .select()
      .from(schema.paymentLinks)
      .where(and(eq(schema.paymentLinks.orgId, orgId), inArray(schema.paymentLinks.subscriptionId, chunk))));
    const existingByKey = new Map(existing.map(l => [`${l.kind}:${l.subscriptionId}`, l]));

    const toInsert: typeof schema.paymentLinks.$inferInsert[] = [];
    for (const item of missing) {
      const link = existingByKey.get(item.key);
      if (link) {
        await db.update(schema.paymentLinks)
          .set({ status: "open", amount: item.amount, claimedAt: null, paidAt: null, updatedAt: now })
          .where(eq(schema.paymentLinks.id, link.id));
        item.payToken = link.token;
      }
      else {
        item.payToken = generateToken();
        toInsert.push({
          orgId,
          memberId: item.memberId,
          subscriptionId: item.subscriptionId,
          kind: item.kind,
          amount: item.amount,
          token: item.payToken,
          status: "open",
          createdAt: now,
          updatedAt: now,
        });
      }
    }
    // 9 columns per row, so 10 rows stay under D1's 100-parameter limit.
    for (let i = 0; i < toInsert.length; i += 10) {
      await db.insert(schema.paymentLinks).values(toInsert.slice(i, i + 10)).onConflictDoNothing();
    }
  }

  // Keep amounts current (a partial payment shrinks the balance).
  const tokens = items.map(i => i.payToken).filter((t): t is string => !!t);
  if (tokens.length === 0) return;
  const links = await selectInChunks(tokens, chunk => db
    .select({ token: schema.paymentLinks.token, amount: schema.paymentLinks.amount })
    .from(schema.paymentLinks)
    .where(inArray(schema.paymentLinks.token, chunk)));
  const amountByToken = new Map(links.map(l => [l.token, l.amount]));
  for (const item of items) {
    const current = amountByToken.get(item.payToken!);
    if (current === undefined) {
      // Lost an insert race with a concurrent request; re-read the winner's token.
      const [link] = await db.select({ token: schema.paymentLinks.token })
        .from(schema.paymentLinks)
        .where(and(eq(schema.paymentLinks.subscriptionId, item.subscriptionId), eq(schema.paymentLinks.kind, item.kind)))
        .limit(1);
      item.payToken = link?.token ?? null;
    }
    else if (current !== item.amount) {
      await db.update(schema.paymentLinks)
        .set({ amount: item.amount, updatedAt: now })
        .where(eq(schema.paymentLinks.token, item.payToken!));
    }
  }
}

export async function closePaymentLink(orgId: number, subscriptionId: number, kind: CollectionKind): Promise<void> {
  const now = new Date().toISOString();
  await db.update(schema.paymentLinks)
    .set({ status: "paid", paidAt: now, updatedAt: now })
    .where(and(
      eq(schema.paymentLinks.orgId, orgId),
      eq(schema.paymentLinks.subscriptionId, subscriptionId),
      eq(schema.paymentLinks.kind, kind),
    ));
}

// ---------- Formatting ----------

/** ₹1,23,456 style rupees from paise (Indian digit grouping, paise shown only if non-zero). */
export function formatRupees(paise: number): string {
  const rupees = Math.floor(paise / 100);
  const rest = paise % 100;
  const s = String(rupees);
  const last3 = s.slice(-3);
  const head = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  const grouped = head ? `${head},${last3}` : last3;
  return `₹${grouped}${rest ? `.${String(rest).padStart(2, "0")}` : ""}`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** "14 Nov" from YYYY-MM-DD. */
export function formatShortDate(date: string): string {
  const [, m, d] = date.split("-").map(Number);
  return `${d} ${MONTHS[m! - 1]}`;
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name;
}

/** 10-digit Indian numbers get the 91 prefix; returns null when the number is unusable. */
export function normalizeIndianPhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  if (digits.length === 11 && digits.startsWith("0")) return `91${digits.slice(1)}`;
  if (digits.length > 10) return `91${digits.slice(-10)}`;
  return null;
}

export const UPI_ID_PATTERN = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z][a-zA-Z0-9.-]{1,64}$/;

/** upi:// deep link that opens the member's UPI app with the amount filled in. */
export function buildUpiLink(opts: { upiId: string; payeeName: string; amount: number; note: string }): string {
  const params = [
    // Not URL-encoded: some UPI apps fail on "%40". UPI_ID_PATTERN only allows safe characters.
    `pa=${opts.upiId}`,
    `pn=${encodeURIComponent(opts.payeeName.slice(0, 50))}`,
    `am=${(opts.amount / 100).toFixed(2)}`,
    "cu=INR",
    `tn=${encodeURIComponent(opts.note.slice(0, 50))}`,
  ];
  return `upi://pay?${params.join("&")}`;
}

export function payPageUrl(token: string): string {
  const base = (useRuntimeConfig().public.appUrl as string) || "https://memberbook.in";
  return `${base.replace(/\/$/, "")}/pay/${token}`;
}

function periodWord(orgType: string): string {
  return orgType === "tuition" ? "fees" : "membership";
}

/** What the reminder says, as plain text parts (shared by tap-to-send and the Cloud API template). */
export function reminderParts(item: Pick<CollectionItem, "kind" | "planName" | "amount" | "dueDate" | "daysLate" | "memberName">, org: Pick<OrgCollectionSettings, "name" | "type">) {
  const what = `${item.planName} ${periodWord(org.type)}`;
  let status: string;
  if (item.kind === "due") {
    status = `${formatRupees(item.amount)} is pending for your ${what}`;
  }
  else if (item.daysLate > 0) {
    status = `your ${what} ended on ${formatShortDate(item.dueDate)}. Renewal fee: ${formatRupees(item.amount)}`;
  }
  else if (item.daysLate === 0) {
    status = `your ${what} ends today. Renewal fee: ${formatRupees(item.amount)}`;
  }
  else {
    status = `your ${what} ends on ${formatShortDate(item.dueDate)}. Renewal fee: ${formatRupees(item.amount)}`;
  }
  return { name: firstName(item.memberName), orgName: org.name, status, what };
}

/** Full WhatsApp message for tap-to-send. */
export function buildReminderMessage(item: CollectionItem, org: OrgCollectionSettings): string {
  const p = reminderParts(item, org);
  const lines = [`Hi ${p.name}, this is ${p.orgName}. ${capitalize(p.status)}.`];
  if (org.upiId && item.payToken) {
    lines.push("", `Pay by UPI here: ${payPageUrl(item.payToken)}`);
  }
  else {
    lines.push("", "Please pay at the front desk on your next visit.");
  }
  lines.push("", "Please ignore this if you have already paid. Thank you!");
  return lines.join("\n");
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export async function logReminder(values: typeof schema.reminderLogs.$inferInsert) {
  const [row] = await db.insert(schema.reminderLogs).values(values).returning();
  return row!;
}

/** Send one reminder through the WhatsApp Cloud API and log it. */
export async function sendCloudReminder(item: CollectionItem, org: OrgCollectionSettings, sentBy: number | null, sender?: WhatsAppSender) {
  // No sender = MemberBook's shared number, which counts toward the monthly allowance.
  const via = sender ? "own" : "memberbook";
  const to = normalizeIndianPhone(item.memberPhone);
  if (!to) return { ok: false as const, error: "No valid phone number" };
  if (!item.payToken) return { ok: false as const, error: "No pay link" };

  const p = reminderParts(item, org);
  const what = item.kind === "due" ? `${p.what} balance` : `${p.what} renewal`;
  const when = item.kind === "due"
    ? "now"
    : item.daysLate > 0
      ? `now (it was due on ${formatShortDate(addDaysToDate(item.dueDate, 1))})`
      : item.daysLate === 0 ? "tomorrow" : `on ${formatShortDate(addDaysToDate(item.dueDate, 1))}`;

  const result = await sendFeeReminderTemplate(to, [p.name, org.name, what, when, formatRupees(item.amount)], item.payToken, sender);
  await logReminder({
    orgId: org.id,
    memberId: item.memberId,
    subscriptionId: item.subscriptionId,
    kind: item.kind,
    channel: "whatsapp_api",
    status: result.ok ? "sent" : "failed",
    amount: item.amount,
    providerMessageId: result.messageId ?? null,
    error: result.error ?? null,
    sentBy,
    via,
  });
  return result.ok ? { ok: true as const } : { ok: false as const, error: result.error };
}
