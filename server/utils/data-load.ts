import { eq, sql } from "drizzle-orm";
import { db, schema } from "@nuxthub/db";
import { normalizePhone } from "~~/shared/utils/phone";

/**
 * Load an owner's plans and members in one go, as read from whatever they sent
 * us (spreadsheet, register photos, pasted text). Used by the AI loading routine
 * through the admin API.
 *
 * Each member's state comes from `dueDate`, the day their next fee is due:
 * - due date in the future: the current period is paid and ends the day before
 *   (Collections picks it up as a renewal when the date comes near);
 * - due date today or earlier: a new period starting on the due date is unpaid
 *   (Collections shows it as due, with how many days late).
 * `pendingAmount` marks part of that period as still owed. Members with a
 * `startDate` instead are loaded like the CSV import (period from that date,
 * `amountPaid` paid).
 */

export interface LoadPlan {
  name: string;
  price: number; // rupees
  durationType: string; // daily, weekly, monthly, yearly
  durationValue: number;
}

export interface LoadMember {
  name: string;
  phone?: string | null;
  email?: string | null;
  gender?: string | null;
  fatherName?: string | null;
  address?: string | null;
  batch?: string | null;
  notes?: string | null;
  plan?: string | null;
  dueDate?: string | null; // YYYY-MM-DD, next fee due
  startDate?: string | null; // YYYY-MM-DD, current period start (alternative to dueDate)
  amountPaid?: number | null; // rupees paid for the period from startDate
  pendingAmount?: number | null; // rupees still owed for the current period
  paymentMethod?: string | null;
}

export interface LoadSkipped {
  name?: string | null;
  reason: string;
}

export interface LoadInput {
  plans?: LoadPlan[];
  members?: LoadMember[];
  /** Rows the reader could not use, passed through to the owner's report. */
  skipped?: LoadSkipped[];
}

export interface LoadResult {
  plansCreated: number;
  membersLoaded: number;
  membersWithoutDueDate: number;
  dueNow: number;
  skipped: LoadSkipped[];
  /** Members loaded, but with something to check (such as an unknown plan). */
  warnings: LoadSkipped[];
}

export const MAX_LOAD_MEMBERS = 500;
const DURATION_TYPES = ["daily", "weekly", "monthly", "yearly"];
const PAYMENT_METHODS = ["cash", "upi", "card", "bank_transfer"];
const MEMBERS_PER_BATCH = 25;

function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

function clean(value: unknown, max = 500): string | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const s = String(value).trim();
  return s ? s.slice(0, max) : null;
}

function toPaise(rupees: unknown): number | null {
  if (rupees === null || rupees === undefined || rupees === "") return null;
  const n = Number(rupees);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null;
}

function shiftDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** The start date of the period that ends on `endDate` (inverse of calculateEndDate). */
export function startDateForEnd(endDate: string, durationType: string, durationValue: number): string {
  const next = shiftDays(endDate, 1); // the following period starts here
  if (durationType === "daily") return shiftDays(next, -durationValue);
  if (durationType === "weekly") return shiftDays(next, -durationValue * 7);
  const months = durationType === "yearly" ? durationValue * 12 : durationValue;
  const [y, m, d] = next.split("-").map(Number) as [number, number, number];
  const target = new Date(Date.UTC(y, m - 1 - months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(d, lastDay));
  return target.toISOString().slice(0, 10);
}

/** Check the shape of a load request. Returns an error message, or null when usable. */
export function validateLoadInput(input: LoadInput): string | null {
  if (!input || typeof input !== "object") return "Send { plans, members, skipped }";
  if (input.plans !== undefined && !Array.isArray(input.plans)) return "plans must be a list";
  if (input.members !== undefined && !Array.isArray(input.members)) return "members must be a list";
  if (input.skipped !== undefined && !Array.isArray(input.skipped)) return "skipped must be a list";
  if ((input.members?.length ?? 0) > MAX_LOAD_MEMBERS) return `At most ${MAX_LOAD_MEMBERS} members per call`;
  for (const p of input.plans ?? []) {
    if (!clean(p?.name, 100)) return "Every plan needs a name";
    if (toPaise(p.price) === null) return `Plan "${p.name}" needs a price in rupees`;
    if (!DURATION_TYPES.includes(p.durationType)) return `Plan "${p.name}": durationType must be daily, weekly, monthly or yearly`;
    if (!Number.isInteger(p.durationValue) || p.durationValue < 1 || p.durationValue > 365) return `Plan "${p.name}": durationValue must be a whole number from 1`;
  }
  return null;
}

export async function loadOrgData(orgId: number, input: LoadInput): Promise<LoadResult> {
  const today = todayIST();
  const skipped: LoadSkipped[] = (input.skipped ?? [])
    .filter(s => s && clean(s.reason))
    .map(s => ({ name: clean(s.name, 100), reason: clean(s.reason, 300)! }));

  // Plans: keep existing ones (matched by name), create the rest.
  const existingPlans = await db.select().from(schema.subscriptionPlans).where(eq(schema.subscriptionPlans.orgId, orgId));
  const planMap = new Map(existingPlans.map(p => [p.name.toLowerCase().trim(), p]));
  const newPlans = (input.plans ?? []).filter((p, i, all) => {
    const key = p.name.toLowerCase().trim();
    return !planMap.has(key) && all.findIndex(q => q.name.toLowerCase().trim() === key) === i;
  });
  if (newPlans.length) {
    const created = await db.insert(schema.subscriptionPlans).values(newPlans.map(p => ({
      orgId,
      name: clean(p.name, 100)!,
      price: toPaise(p.price)!,
      durationType: p.durationType,
      durationValue: p.durationValue,
    }))).returning();
    for (const p of created) planMap.set(p.name.toLowerCase().trim(), p);
  }

  // Members already in MemberBook are skipped, so loading the same data twice is harmless.
  const existingMembers = await db
    .select({ name: schema.members.name, phone: schema.members.phone })
    .from(schema.members)
    .where(eq(schema.members.orgId, orgId));
  const seenPhones = new Set(existingMembers.map(m => m.phone).filter(Boolean) as string[]);
  const seenNames = new Set(existingMembers.filter(m => !m.phone).map(m => m.name.toLowerCase().trim()));

  const warnings: LoadSkipped[] = [];
  let membersLoaded = 0;
  let membersWithoutDueDate = 0;
  let dueNow = 0;
  let statements: ReturnType<typeof db.run>[] = [];
  const flush = async () => {
    if (!statements.length) return;
    // Run in one batch (a single transaction); each member's rows chain on last_insert_rowid().
    await db.batch(statements as unknown as Parameters<typeof db.batch>[0]);
    statements = [];
  };
  let inBatch = 0;

  for (const raw of input.members ?? []) {
    const name = clean(raw?.name, 100);
    if (!name) {
      skipped.push({ name: null, reason: "No name" });
      continue;
    }
    let phone: string | null = null;
    if (clean(raw.phone)) {
      phone = normalizePhone(String(raw.phone));
      if (!phone) {
        skipped.push({ name, reason: `Phone number "${clean(raw.phone, 30)}" is not a valid mobile number` });
        continue;
      }
    }
    if (phone ? seenPhones.has(phone) : seenNames.has(name.toLowerCase())) {
      skipped.push({ name, reason: "Already in MemberBook" });
      continue;
    }
    for (const field of ["dueDate", "startDate"] as const) {
      if (raw[field] && !isIsoDate(raw[field])) {
        raw[field] = null;
      }
    }

    const plan = clean(raw.plan) ? planMap.get(String(raw.plan).toLowerCase().trim()) : undefined;
    let period: { start: string; end: string; paid: number } | null = null;
    if (plan && raw.dueDate) {
      const pending = Math.min(toPaise(raw.pendingAmount) ?? 0, plan.price);
      if (raw.dueDate > today) {
        const end = shiftDays(raw.dueDate, -1);
        period = { start: startDateForEnd(end, plan.durationType, plan.durationValue), end, paid: plan.price - pending };
      }
      else {
        const start = raw.dueDate;
        period = {
          start,
          end: calculateEndDate(start, plan.durationType, plan.durationValue),
          paid: pending > 0 ? plan.price - pending : 0,
        };
      }
    }
    else if (plan && raw.startDate) {
      const paid = Math.min(toPaise(raw.amountPaid) ?? plan.price, plan.price);
      const pending = toPaise(raw.pendingAmount);
      period = {
        start: raw.startDate,
        end: calculateEndDate(raw.startDate, plan.durationType, plan.durationValue),
        paid: pending !== null ? Math.max(plan.price - pending, 0) : paid,
      };
    }

    const gender = raw.gender === "male" || raw.gender === "female" ? raw.gender : null;
    statements.push(db.run(sql`
      INSERT INTO members (org_id, name, phone, email, gender, status, notes, father_name, address, batch, created_at)
      VALUES (${orgId}, ${name}, ${phone}, ${clean(raw.email, 200)}, ${gender}, 'active', ${clean(raw.notes)},
        ${clean(raw.fatherName, 100)}, ${clean(raw.address)}, ${clean(raw.batch, 100)}, ${new Date().toISOString()})
    `));

    if (plan && period) {
      const status = period.paid >= plan.price ? "paid" : period.paid > 0 ? "partial" : "unpaid";
      if (status !== "paid" && period.start <= today) dueNow++;
      statements.push(db.run(sql`
        INSERT INTO member_subscriptions (org_id, member_id, plan_id, start_date, end_date, amount, status, auto_renew, payment_status, created_at)
        VALUES (${orgId}, last_insert_rowid(), ${plan.id}, ${period.start}, ${period.end}, ${plan.price},
          ${period.end >= today ? "active" : "expired"}, 1, ${status}, ${new Date().toISOString()})
      `));
      if (period.paid > 0) {
        const method = PAYMENT_METHODS.includes(String(raw.paymentMethod)) ? String(raw.paymentMethod) : "cash";
        statements.push(db.run(sql`
          INSERT INTO payments (org_id, member_id, subscription_id, amount, method, date, notes, created_at)
          SELECT ${orgId}, ms.member_id, ms.id, ${period.paid}, ${method}, ${period.start},
            'Paid before MemberBook (loaded from your data)', ${new Date().toISOString()}
          FROM member_subscriptions ms WHERE ms.id = last_insert_rowid()
        `));
      }
    }
    else {
      membersWithoutDueDate++;
      if (clean(raw.plan) && !plan) {
        warnings.push({ name, reason: `Loaded without a due date: no plan called "${clean(raw.plan, 100)}"` });
      }
    }

    if (phone) seenPhones.add(phone);
    else seenNames.add(name.toLowerCase());
    membersLoaded++;
    if (++inBatch >= MEMBERS_PER_BATCH) {
      await flush();
      inBatch = 0;
    }
  }
  await flush();

  return { plansCreated: newPlans.length, membersLoaded, membersWithoutDueDate, dueNow, skipped, warnings };
}
