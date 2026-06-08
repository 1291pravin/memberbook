import { and, eq, sql } from "drizzle-orm";

export const paymentMethods = ["cash", "upi", "card", "bank_transfer"] as const;

export function isPaymentMethod(value: unknown): value is typeof paymentMethods[number] {
  return typeof value === "string" && paymentMethods.includes(value as typeof paymentMethods[number]);
}

export function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

export function parsePaymentAmount(value: unknown): number | null {
  const amount = Number(value);
  return Number.isInteger(amount) && amount > 0 ? amount : null;
}

export async function getSubscriptionPaidTotal(subscriptionId: number, orgId: number, excludePaymentId?: number): Promise<number> {
  const conditions = [
    eq(schema.payments.subscriptionId, subscriptionId),
    eq(schema.payments.orgId, orgId),
  ];
  if (excludePaymentId) conditions.push(sql`${schema.payments.id} != ${excludePaymentId}`);

  const [result] = await db
    .select({ total: sql<number>`COALESCE(SUM(${schema.payments.amount}), 0)` })
    .from(schema.payments)
    .where(and(...conditions));

  return Number(result?.total ?? 0);
}

export async function recalculateSubscriptionPaymentStatus(subscriptionId: number | null, orgId: number): Promise<void> {
  if (!subscriptionId) return;

  const [subscription] = await db
    .select({ amount: schema.memberSubscriptions.amount })
    .from(schema.memberSubscriptions)
    .where(and(
      eq(schema.memberSubscriptions.id, subscriptionId),
      eq(schema.memberSubscriptions.orgId, orgId),
    ))
    .limit(1);

  if (!subscription) return;

  const totalPaid = await getSubscriptionPaidTotal(subscriptionId, orgId);
  const paymentStatus = totalPaid <= 0 ? "unpaid" : totalPaid >= subscription.amount ? "paid" : "partial";

  await db
    .update(schema.memberSubscriptions)
    .set({ paymentStatus })
    .where(and(
      eq(schema.memberSubscriptions.id, subscriptionId),
      eq(schema.memberSubscriptions.orgId, orgId),
    ));
}

export async function getPaymentSubscription(subscriptionId: unknown, memberId: number, orgId: number) {
  const id = Number(subscriptionId);
  if (!Number.isInteger(id) || id <= 0) return null;

  const [subscription] = await db
    .select()
    .from(schema.memberSubscriptions)
    .where(and(
      eq(schema.memberSubscriptions.id, id),
      eq(schema.memberSubscriptions.memberId, memberId),
      eq(schema.memberSubscriptions.orgId, orgId),
    ))
    .limit(1);

  return subscription ?? null;
}
