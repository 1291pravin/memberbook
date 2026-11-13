import type { H3Event } from "h3";
import { and, eq, isNull, sql } from "drizzle-orm";
import { db, schema } from "@nuxthub/db";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

/**
 * PDF receipts for payments, and the optional WhatsApp thank-you that carries
 * one (owner's switch in Collections > Payment settings).
 *
 * Every payment can have a receipt. The receipt number (per business) and the
 * public link token are given out the first time a receipt is needed, so old
 * payments get receipts too.
 */

export const RECEIPT_TEMPLATE_NAME = "payment_receipt";

export interface ReceiptData {
  paymentId: number;
  orgId: number;
  memberId: number;
  receiptNo: number;
  token: string;
  businessName: string;
  businessPhone: string | null;
  memberName: string;
  memberPhone: string | null;
  amount: number;
  method: string;
  date: string;
  planName: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  balanceDue: number;
  subscriptionId: number | null;
}

/** Give a payment its receipt number and public token if it doesn't have them yet. */
export async function ensureReceipt(orgId: number, paymentId: number): Promise<{ receiptNo: number; token: string } | null> {
  const read = async () => {
    const [row] = await db.select({ receiptNo: schema.payments.receiptNo, token: schema.payments.receiptToken })
      .from(schema.payments)
      .where(and(eq(schema.payments.id, paymentId), eq(schema.payments.orgId, orgId))).limit(1);
    return row;
  };
  const row = await read();
  if (!row) return null;
  if (row.receiptNo && row.token) return { receiptNo: row.receiptNo, token: row.token };

  // One statement, so two receipts made at once can't get the same number.
  await db.update(schema.payments).set({
    receiptToken: generateToken() + generateToken().slice(0, 8),
    receiptNo: sql`(SELECT COALESCE(MAX(p2.receipt_no), 0) + 1 FROM payments p2 WHERE p2.org_id = ${orgId})`,
  }).where(and(eq(schema.payments.id, paymentId), eq(schema.payments.orgId, orgId), isNull(schema.payments.receiptToken)));

  const after = await read();
  return after?.receiptNo && after.token ? { receiptNo: after.receiptNo, token: after.token } : null;
}

async function loadReceipt(where: ReturnType<typeof eq>): Promise<Omit<ReceiptData, "receiptNo" | "token"> & { receiptNo: number | null; token: string | null } | null> {
  const [row] = await db.select({
    paymentId: schema.payments.id,
    orgId: schema.payments.orgId,
    memberId: schema.payments.memberId,
    receiptNo: schema.payments.receiptNo,
    token: schema.payments.receiptToken,
    amount: schema.payments.amount,
    method: schema.payments.method,
    date: schema.payments.date,
    subscriptionId: schema.payments.subscriptionId,
    businessName: schema.organizations.name,
    businessPhone: schema.organizations.ownerWhatsapp,
    memberName: schema.members.name,
    memberPhone: schema.members.phone,
    periodStart: schema.memberSubscriptions.startDate,
    periodEnd: schema.memberSubscriptions.endDate,
    subAmount: schema.memberSubscriptions.amount,
    planName: schema.subscriptionPlans.name,
  })
    .from(schema.payments)
    .innerJoin(schema.organizations, eq(schema.organizations.id, schema.payments.orgId))
    .innerJoin(schema.members, eq(schema.members.id, schema.payments.memberId))
    .leftJoin(schema.memberSubscriptions, eq(schema.memberSubscriptions.id, schema.payments.subscriptionId))
    .leftJoin(schema.subscriptionPlans, eq(schema.subscriptionPlans.id, schema.memberSubscriptions.planId))
    .where(where)
    .limit(1);
  if (!row) return null;

  let balanceDue = 0;
  if (row.subscriptionId && row.subAmount) {
    const [paid] = await db.select({ total: sql<number>`COALESCE(SUM(${schema.payments.amount}), 0)` })
      .from(schema.payments)
      .where(and(eq(schema.payments.subscriptionId, row.subscriptionId), eq(schema.payments.orgId, row.orgId)));
    balanceDue = Math.max(0, row.subAmount - Number(paid?.total ?? 0));
  }

  return {
    paymentId: row.paymentId,
    orgId: row.orgId,
    memberId: row.memberId,
    receiptNo: row.receiptNo,
    token: row.token,
    businessName: row.businessName,
    businessPhone: row.businessPhone,
    memberName: row.memberName,
    memberPhone: row.memberPhone,
    amount: row.amount,
    method: row.method,
    date: row.date,
    planName: row.planName ?? null,
    periodStart: row.periodStart ?? null,
    periodEnd: row.periodEnd ?? null,
    balanceDue,
    subscriptionId: row.subscriptionId,
  };
}

/** Receipt for a payment in this business (owner/staff download). Makes the receipt number if needed. */
export async function getReceiptForPayment(orgId: number, paymentId: number): Promise<ReceiptData | null> {
  const ids = await ensureReceipt(orgId, paymentId);
  if (!ids) return null;
  const data = await loadReceipt(eq(schema.payments.id, paymentId));
  return data && data.orgId === orgId ? { ...data, ...ids } : null;
}

/** Receipt by its public token (the link in the WhatsApp thank-you). */
export async function getReceiptByToken(token: string): Promise<ReceiptData | null> {
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) return null;
  const data = await loadReceipt(eq(schema.payments.receiptToken, token));
  if (!data?.receiptNo || !data.token) return null;
  return { ...data, receiptNo: data.receiptNo, token: data.token };
}

export function receiptUrl(token: string): string {
  const base = (useRuntimeConfig().public.appUrl as string) || "https://memberbook.in";
  return `${base.replace(/\/$/, "")}/receipt/${token}`;
}

export function receiptFileName(r: Pick<ReceiptData, "receiptNo" | "businessName">) {
  const slug = r.businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 30) || "receipt";
  return `receipt-${r.receiptNo}-${slug}.pdf`;
}

// ------------------------------------------------------------------ PDF

const METHOD_LABEL: Record<string, string> = { cash: "Cash", upi: "UPI", card: "Card", bank_transfer: "Bank transfer" };

/** The built-in PDF font only has Latin characters: swap the rupee sign, drop the rest. */
function pdfText(s: string | null | undefined, fallback = ""): string {
  const out = String(s ?? "").replace(/₹/g, "Rs. ").replace(/[^\x20-\x7E\xA0-\xFF]/g, "").replace(/\s+/g, " ").trim();
  return out || fallback;
}

function rupees(paise: number): string {
  return `Rs. ${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: paise % 100 ? 2 : 0, maximumFractionDigits: 2 })}`;
}

function longDate(date: string | null): string {
  if (!date) return "";
  const d = new Date(`${date}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? date : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

export async function renderReceiptPdf(r: ReceiptData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Receipt ${r.receiptNo} - ${pdfText(r.businessName, "Receipt")}`);
  pdf.setProducer("MemberBook");
  pdf.setCreator("MemberBook (memberbook.in)");
  const page = pdf.addPage([420, 595]); // A5 portrait
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(0.12, 0.16, 0.22);
  const soft = rgb(0.33, 0.38, 0.45);
  const teal = rgb(0.05, 0.46, 0.43);
  const line = rgb(0.86, 0.88, 0.9);
  const { width, height } = page.getSize();
  const left = 36;
  const right = width - 36;

  const text = (s: string, x: number, y: number, size: number, f = font, color = ink) => page.drawText(s, { x, y, size, font: f, color });
  const textRight = (s: string, y: number, size: number, f = font, color = ink, inset = 0) => text(s, right - inset - f.widthOfTextAtSize(s, size), y, size, f, color);
  const fit = (s: string, size: number, f: typeof font, max: number) => {
    let out = s;
    while (out.length > 1 && f.widthOfTextAtSize(out, size) > max) out = out.slice(0, -1);
    return out === s ? s : `${out.slice(0, -1)}...`;
  };

  // Header band
  page.drawRectangle({ x: 0, y: height - 92, width, height: 92, color: teal });
  text(fit(pdfText(r.businessName, "Receipt"), 18, bold, width - 72), left, height - 46, 18, bold, rgb(1, 1, 1));
  if (r.businessPhone) text(`Phone: ${pdfText(r.businessPhone)}`, left, height - 66, 10, font, rgb(0.9, 0.97, 0.96));

  let y = height - 128;
  text("PAYMENT RECEIPT", left, y, 12, bold, teal);
  textRight(`Receipt no. ${r.receiptNo}`, y, 10, bold);
  y -= 16;
  textRight(longDate(r.date), y, 10, font, soft);

  y -= 30;
  text("Received from", left, y, 9, font, soft);
  y -= 15;
  text(fit(pdfText(r.memberName, "Member"), 13, bold, right - left), left, y, 13, bold);
  if (r.memberPhone) {
    y -= 14;
    text(pdfText(r.memberPhone), left, y, 10, font, soft);
  }

  // Amount box
  y -= 34;
  page.drawRectangle({ x: left, y: y - 24, width: right - left, height: 52, color: rgb(0.94, 0.98, 0.97), borderColor: rgb(0.8, 0.92, 0.9), borderWidth: 1 });
  text("Amount paid", left + 14, y + 8, 10, font, soft);
  text(rupees(r.amount), left + 14, y - 12, 18, bold);
  textRight(`Paid by ${METHOD_LABEL[r.method] ?? pdfText(r.method, "cash")}`, y - 8, 10, font, soft, 14);

  // Details
  y -= 58;
  const row = (label: string, value: string) => {
    text(label, left, y, 10, font, soft);
    textRight(fit(value, 10, bold, 220), y, 10, bold);
    y -= 8;
    page.drawLine({ start: { x: left, y }, end: { x: right, y }, thickness: 0.6, color: line });
    y -= 16;
  };
  if (r.planName) row("For", pdfText(r.planName, "Membership"));
  if (r.periodStart && r.periodEnd) row("Period", `${longDate(r.periodStart)} to ${longDate(r.periodEnd)}`);
  row("Payment date", longDate(r.date));
  if (r.subscriptionId) row("Balance due", r.balanceDue > 0 ? rupees(r.balanceDue) : "Nil");
  if (r.periodEnd) row("Next payment due", longDate(addDaysToDate(r.periodEnd, 1)));

  // Footer
  text("Thank you!", left, 92, 14, bold, teal);
  text("This is a computer-generated receipt and needs no signature.", left, 70, 8.5, font, soft);
  text("Made with MemberBook - memberbook.in", left, 56, 8.5, font, soft);

  return pdf.save();
}

// ------------------------------------------------------------------ WhatsApp thank-you

/**
 * Send the thank-you with the PDF receipt, if the owner switched it on and
 * automatic reminders are paid up. Only from MemberBook's number (a business's
 * own number doesn't have the receipt template). Counts toward the monthly
 * allowance like a reminder.
 */
export async function sendThankYouReceipt(orgId: number, paymentId: number): Promise<{ sent: boolean; reason?: string }> {
  const [org] = await db.select({ on: schema.organizations.thankYouReceipts, name: schema.organizations.name })
    .from(schema.organizations).where(eq(schema.organizations.id, orgId)).limit(1);
  if (!org?.on) return { sent: false, reason: "off" };

  const sending = await reminderSending(orgId);
  if (!sending.available || sending.via !== "memberbook" || sending.blocked) return { sent: false, reason: sending.blocked ?? "unavailable" };

  const receipt = await getReceiptForPayment(orgId, paymentId);
  if (!receipt?.subscriptionId) return { sent: false, reason: "no subscription" };
  const to = normalizeIndianPhone(receipt.memberPhone);
  if (!to) return { sent: false, reason: "no phone" };

  const result = await sendReceiptTemplate(
    to,
    [firstName(receipt.memberName), formatRupees(receipt.amount), receipt.businessName, receipt.planName || "your membership"],
    receiptUrl(receipt.token),
    receiptFileName(receipt),
  );
  await logReminder({
    orgId,
    memberId: receipt.memberId,
    subscriptionId: receipt.subscriptionId,
    kind: "receipt",
    channel: "whatsapp_api",
    status: result.ok ? "sent" : "failed",
    amount: receipt.amount,
    providerMessageId: result.messageId ?? null,
    error: result.error ?? null,
    sentBy: null,
    via: "memberbook",
  });
  return result.ok ? { sent: true } : { sent: false, reason: result.error };
}

/** Send the thank-you after the response, so recording a payment stays fast. */
export function queueThankYouReceipt(event: H3Event, orgId: number, paymentId: number | null | undefined) {
  if (!paymentId) return;
  const job = sendThankYouReceipt(orgId, paymentId)
    .then((r) => { if (!r.sent && r.reason !== "off") console.log(`[receipt] org=${orgId} payment=${paymentId} not sent: ${r.reason}`); })
    .catch(err => console.error(`[receipt] org=${orgId} payment=${paymentId}`, err));
  const ctx = event.context.cloudflare?.context as { waitUntil?: (p: Promise<unknown>) => void } | undefined;
  if (ctx?.waitUntil) ctx.waitUntil(job);
  else if (typeof event.waitUntil === "function") event.waitUntil(job);
}
