import { and, eq, inArray } from "drizzle-orm";
import { db, schema } from "@nuxthub/db";

/**
 * Which plan a business is on, read from its prepaid plan rows in org_add_ons
 * (see shared/utils/plans.ts). Pro wins over Autopilot if both are somehow on.
 */
export interface OrgPlanState {
  plan: PlanKey;
  name: string;
  cycle: BillingCycle;
  /** Paise per period, as locked when the plan started. */
  price: number;
  /** Paid (or in the free trial) through today. */
  paid: boolean;
  paidUntil: string | null;
  /** Paid-up only because of the free trial. */
  inTrial: boolean;
  trialEndsOn: string | null;
  /** WhatsApp reminders a month from MemberBook's number. */
  reminderLimit: number;
  addOnKey: "auto_reminders" | "pro" | null;
  /** The free trial of each paid plan was used already. */
  trialUsed: { autopilot: boolean; pro: boolean };
}

type PlanRow = typeof schema.orgAddOns.$inferSelect;

async function planRows(orgId: number) {
  const rows = await db.select().from(schema.orgAddOns)
    .where(and(eq(schema.orgAddOns.orgId, orgId), inArray(schema.orgAddOns.addOn, ["auto_reminders", "pro"])));
  const byKey = new Map<string, PlanRow>(rows.map((r: PlanRow) => [r.addOn, r]));
  return { autopilot: byKey.get("auto_reminders"), pro: byKey.get("pro") };
}

function trialUsed(row: PlanRow | undefined) {
  return Boolean(row?.trialEndsOn || row?.paidUntil);
}

export async function getOrgPlan(orgId: number): Promise<OrgPlanState> {
  const rows = await planRows(orgId);
  const used = { autopilot: trialUsed(rows.autopilot), pro: trialUsed(rows.pro) };
  const key: PlanKey = rows.pro?.status === "active" ? "pro" : rows.autopilot?.status === "active" ? "autopilot" : "free";
  const def = getPlanDef(key);
  const row = key === "pro" ? rows.pro : key === "autopilot" ? rows.autopilot : undefined;
  const paid = row ? isPrepaidActive(row.paidUntil) : false;
  return {
    plan: key,
    name: def.name,
    cycle: (row?.billingCycle as BillingCycle) || "monthly",
    price: row?.price ?? 0,
    paid,
    paidUntil: row?.paidUntil ?? null,
    inTrial: paid && Boolean(row?.trialEndsOn) && row?.paidUntil === row?.trialEndsOn,
    trialEndsOn: row?.trialEndsOn ?? null,
    reminderLimit: def.reminders,
    addOnKey: def.addOnKey,
    trialUsed: used,
  };
}

/** Pro is on and paid (or in its trial). */
export async function isProPaid(orgId: number) {
  const plan = await getOrgPlan(orgId);
  return plan.plan === "pro" && plan.paid;
}

/** Per-day value of a plan row's remaining paid (not trial) days, for switching plans. */
function remainingCreditPaise(row: PlanRow | undefined) {
  if (!row || row.status !== "active" || !isPrepaidActive(row.paidUntil)) return 0;
  // Trial days are free: nothing to carry over.
  if (row.trialEndsOn && row.paidUntil === row.trialEndsOn) return 0;
  const days = daysBetween(todayIST(), row.paidUntil!) + 1;
  const perDay = row.price / cycleDays((row.billingCycle as BillingCycle) || "monthly");
  return Math.max(0, Math.floor(days * perDay));
}

function daysBetween(from: string, to: string) {
  return Math.round((new Date(`${to}T00:00:00Z`).getTime() - new Date(`${from}T00:00:00Z`).getTime()) / 86400000);
}

async function endPlanRow(orgId: number, key: "auto_reminders" | "pro", keepPaidPeriod: boolean) {
  const now = new Date().toISOString();
  await db.update(schema.orgAddOns).set({
    status: "off",
    cancelledAt: now,
    updatedAt: now,
    // Paid days moved to the new plan: close them here so they aren't used twice.
    ...(keepPaidPeriod ? {} : { paidUntil: addDaysToDate(todayIST(), -1) }),
  }).where(and(eq(schema.orgAddOns.orgId, orgId), eq(schema.orgAddOns.addOn, key), eq(schema.orgAddOns.status, "active")));
  await dropUnpaidPrepaidBill(orgId, key);
}

async function takeWebsiteOffline(orgId: number) {
  await db.update(schema.orgWebsites).set({ status: "off", updatedAt: new Date().toISOString() })
    .where(and(eq(schema.orgWebsites.orgId, orgId), eq(schema.orgWebsites.status, "live")));
}

/**
 * The owner picks a plan. Paid plans start with a 14-day free trial the first
 * time; otherwise they need a payment (a bill appears) unless paid days carry
 * over from the plan they're leaving, which convert at the new plan's price.
 */
export async function choosePlan(orgId: number, plan: PlanKey, cycle: BillingCycle) {
  const rows = await planRows(orgId);
  const current = await getOrgPlan(orgId);

  if (plan === "free") {
    // Keep a paid period on the row, so coming back within it costs nothing.
    if (rows.pro?.status === "active") await endPlanRow(orgId, "pro", true);
    if (rows.autopilot?.status === "active") await endPlanRow(orgId, "auto_reminders", true);
    if (current.plan === "pro") await takeWebsiteOffline(orgId);
    await db.update(schema.organizations).set({ autoRemindersEnabled: false }).where(eq(schema.organizations.id, orgId));
    return;
  }

  const def = getPlanDef(plan);
  const key = def.addOnKey!;
  const price = planPrice(def, cycle);

  // Same plan, other billing cycle: change the price for the next payment.
  if (current.plan === plan) {
    if (current.cycle === cycle) return;
    await db.update(schema.orgAddOns).set({ billingCycle: cycle, price, updatedAt: new Date().toISOString() })
      .where(and(eq(schema.orgAddOns.orgId, orgId), eq(schema.orgAddOns.addOn, key)));
    const bill = await openPrepaidBill(orgId, key);
    if (bill?.status === "due") {
      await dropUnpaidPrepaidBill(orgId, key);
      if (!current.paid) await ensurePrepaidBill(orgId, key);
    }
    return;
  }

  // Leaving the other paid plan: carry its paid days over as credit.
  const otherKey = key === "pro" ? "auto_reminders" : "pro";
  const otherRow = key === "pro" ? rows.autopilot : rows.pro;
  const credit = remainingCreditPaise(otherRow);
  if (otherRow?.status === "active") await endPlanRow(orgId, otherKey, credit === 0);
  if (current.plan === "pro") await takeWebsiteOffline(orgId);

  await startAddOn(orgId, key, { price, cycle });

  if (credit > 0) {
    const creditDays = Math.floor(credit / (price / cycleDays(cycle)));
    if (creditDays > 0) {
      const [row] = await db.select({ paidUntil: schema.orgAddOns.paidUntil }).from(schema.orgAddOns)
        .where(and(eq(schema.orgAddOns.orgId, orgId), eq(schema.orgAddOns.addOn, key))).limit(1);
      const today = todayIST();
      const from = row?.paidUntil && row.paidUntil >= today ? addDaysToDate(row.paidUntil, 1) : today;
      await db.update(schema.orgAddOns).set({ paidUntil: addDaysToDate(from, creditDays - 1), updatedAt: new Date().toISOString() })
        .where(and(eq(schema.orgAddOns.orgId, orgId), eq(schema.orgAddOns.addOn, key)));
      // Paid up by the credit: no bill needed right now.
      await dropUnpaidPrepaidBill(orgId, key);
    }
  }

  // Reminders are the heart of both paid plans: switch them on if the UPI ID is set.
  const [org] = await db.select({ upiId: schema.organizations.upiId }).from(schema.organizations)
    .where(eq(schema.organizations.id, orgId)).limit(1);
  if (org?.upiId) {
    await db.update(schema.organizations).set({ autoRemindersEnabled: true }).where(eq(schema.organizations.id, orgId));
  }
}
