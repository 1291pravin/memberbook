import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "@nuxthub/db";

/**
 * The member's own page, /m/<token>: no login, no app. Shows their plan,
 * when it ends, what's due with a pay button, receipts and their visit streak.
 * The owner shares the link from the member's page.
 */

function newToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function memberPageUrl(token: string): string {
  const base = (useRuntimeConfig().public.appUrl as string) || "https://memberbook.in";
  return `${base.replace(/\/$/, "")}/m/${token}`;
}

export async function ensureMemberPortalToken(orgId: number, memberId: number): Promise<string | null> {
  const [m] = await db.select({ token: schema.members.portalToken }).from(schema.members)
    .where(and(eq(schema.members.id, memberId), eq(schema.members.orgId, orgId))).limit(1);
  if (!m) return null;
  if (m.token) return m.token;
  const token = newToken();
  await db.update(schema.members).set({ portalToken: token })
    .where(and(eq(schema.members.id, memberId), eq(schema.members.orgId, orgId)));
  return token;
}

export async function loadMemberPortal(token: string) {
  if (!/^[A-Za-z0-9_-]{12,40}$/.test(token)) return null;
  const [m] = await db.select({
    id: schema.members.id,
    orgId: schema.members.orgId,
    name: schema.members.name,
    status: schema.members.status,
    orgName: schema.organizations.name,
    orgType: schema.organizations.type,
    orgPhone: schema.organizations.ownerWhatsapp,
    checkInToken: schema.organizations.checkInToken,
    reminderDaysBefore: schema.organizations.reminderDaysBefore,
  })
    .from(schema.members)
    .innerJoin(schema.organizations, eq(schema.organizations.id, schema.members.orgId))
    .where(eq(schema.members.portalToken, token)).limit(1);
  if (!m) return null;

  const today = todayIST();
  const [subs, receipts, visits, items] = await Promise.all([
    db.select({
      id: schema.memberSubscriptions.id,
      planName: schema.subscriptionPlans.name,
      startDate: schema.memberSubscriptions.startDate,
      endDate: schema.memberSubscriptions.endDate,
      amount: schema.memberSubscriptions.amount,
      status: schema.memberSubscriptions.status,
      pauseStart: schema.memberSubscriptions.pauseStart,
      pauseEnd: schema.memberSubscriptions.pauseEnd,
    })
      .from(schema.memberSubscriptions)
      .innerJoin(schema.subscriptionPlans, eq(schema.subscriptionPlans.id, schema.memberSubscriptions.planId))
      .where(and(eq(schema.memberSubscriptions.orgId, m.orgId), eq(schema.memberSubscriptions.memberId, m.id)))
      .orderBy(desc(schema.memberSubscriptions.endDate))
      .limit(5),
    db.select({ id: schema.payments.id, amount: schema.payments.amount, date: schema.payments.date, token: schema.payments.receiptToken, receiptNo: schema.payments.receiptNo })
      .from(schema.payments)
      .where(and(eq(schema.payments.orgId, m.orgId), eq(schema.payments.memberId, m.id)))
      .orderBy(desc(schema.payments.date))
      .limit(10),
    getMemberVisitStats(m.orgId, m.id),
    getCollections(m.orgId, m.reminderDaysBefore).then(all => all.filter(i => i.memberId === m.id)),
  ]);
  // Older payments get their receipt number and link the first time they're shown.
  for (const r of receipts) {
    if (r.token && r.receiptNo) continue;
    const made = await ensureReceipt(m.orgId, r.id);
    if (made) Object.assign(r, { token: made.token, receiptNo: made.receiptNo });
  }
  // Every due item gets a pay link, so the member can pay right here.
  if (items.length) await ensurePaymentLinks(m.orgId, items);

  const current = subs.find(s => s.status !== "cancelled" && s.startDate <= today && s.endDate >= today) ?? subs.find(s => s.status !== "cancelled") ?? null;
  const instalments = current ? (await instalmentsFor(m.orgId, [current.id])).get(current.id) ?? [] : [];
  return {
    orgName: m.orgName,
    orgType: m.orgType,
    orgPhone: m.orgPhone,
    memberName: m.name,
    firstName: firstName(m.name),
    plan: current
      ? {
          name: current.planName,
          startDate: current.startDate,
          endDate: current.endDate,
          active: current.endDate >= today && current.startDate <= today,
          paused: !!current.pauseStart && !!current.pauseEnd && current.pauseStart <= today && current.pauseEnd >= today,
          pauseEnd: current.pauseEnd,
          daysLeft: Math.max(0, Math.round((Date.parse(current.endDate) - Date.parse(today)) / 86400000) + 1),
        }
      : null,
    instalments,
    due: items.map(i => ({
      kind: i.kind,
      planName: i.planName,
      amount: i.amount,
      dueDate: i.dueDate,
      overdue: i.overdue,
      payUrl: i.payToken ? `/pay/${i.payToken}` : null,
    })),
    receipts: receipts.map(r => ({ amount: r.amount, date: r.date, receiptNo: r.receiptNo, url: `/receipt/${r.token}` })),
    visits,
  };
}
