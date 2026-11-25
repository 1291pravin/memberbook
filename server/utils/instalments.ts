import { and, eq, inArray } from "drizzle-orm";
import { db, schema } from "@nuxthub/db";

/**
 * Instalment plans: a subscription's fee due in parts on set dates, so the
 * Fees due list and automatic reminders ask only for the part that is due.
 */

export interface Instalment { dueDate: string; amount: number }

/** Split `total` paise into `count` equal parts (the last takes the rounding), `everyDays` apart. */
export function equalInstalments(total: number, count: number, firstDueDate: string, everyDays: number): Instalment[] {
  const part = Math.floor(total / count / 100) * 100; // whole rupees
  return Array.from({ length: count }, (_, i) => ({
    dueDate: addDaysToDate(firstDueDate, i * everyDays),
    amount: i === count - 1 ? total - part * (count - 1) : part,
  }));
}

/** Instalments per subscription (sorted by due date), for the given subscriptions. */
export async function instalmentsFor(orgId: number, subscriptionIds: number[]): Promise<Map<number, Instalment[]>> {
  const map = new Map<number, Instalment[]>();
  for (let i = 0; i < subscriptionIds.length; i += 90) {
    const rows = await db.select({
      subscriptionId: schema.subscriptionInstalments.subscriptionId,
      dueDate: schema.subscriptionInstalments.dueDate,
      amount: schema.subscriptionInstalments.amount,
    })
      .from(schema.subscriptionInstalments)
      .where(and(eq(schema.subscriptionInstalments.orgId, orgId), inArray(schema.subscriptionInstalments.subscriptionId, subscriptionIds.slice(i, i + 90))));
    for (const r of rows) {
      const list = map.get(r.subscriptionId) ?? [];
      list.push({ dueDate: r.dueDate, amount: r.amount });
      map.set(r.subscriptionId, list);
    }
  }
  for (const list of map.values()) list.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  return map;
}

/**
 * What's owed on an instalment plan by `horizon` (YYYY-MM-DD), given what's
 * been paid: the amount, and the due date of the first unpaid instalment.
 * Payments fill instalments in date order.
 */
export function instalmentDue(list: Instalment[], paid: number, horizon: string): { amount: number; dueDate: string } | null {
  let cumulative = 0;
  let firstUnpaid: string | null = null;
  let dueByHorizon = 0;
  for (const it of list) {
    cumulative += it.amount;
    if (!firstUnpaid && cumulative > paid) firstUnpaid = it.dueDate;
    if (it.dueDate <= horizon) dueByHorizon = cumulative;
  }
  const amount = dueByHorizon - paid;
  return amount > 0 && firstUnpaid ? { amount, dueDate: firstUnpaid } : null;
}
