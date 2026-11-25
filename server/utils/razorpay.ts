import type { H3Event } from "h3";
import { eq } from "drizzle-orm";
import { db, schema } from "@nuxthub/db";

/**
 * Online payments that confirm themselves. The owner connects their own
 * Razorpay account (we take no cut and never hold the money). A member's pay
 * link creates a Razorpay Payment Link; when it's paid, the callback (and the
 * optional webhook) records the payment and renews the member automatically.
 *
 * Secrets are stored AES-GCM encrypted (encryptSecret) and never sent to the browser.
 */

const API = "https://api.razorpay.com/v1";

export interface RazorpayCreds { keyId: string; keySecret: string; webhookSecret: string | null }

export function isRazorpayKeyId(v: unknown): v is string {
  return typeof v === "string" && /^rzp_(live|test)_[A-Za-z0-9]{8,32}$/.test(v);
}

export async function getRazorpayCreds(orgId: number): Promise<RazorpayCreds | null> {
  const [org] = await db.select({
    keyId: schema.organizations.razorpayKeyId,
    keySecretEnc: schema.organizations.razorpayKeySecretEnc,
    webhookSecretEnc: schema.organizations.razorpayWebhookSecretEnc,
  }).from(schema.organizations).where(eq(schema.organizations.id, orgId)).limit(1);
  if (!org?.keyId || !org.keySecretEnc) return null;
  const keySecret = await decryptSecret(org.keySecretEnc);
  if (!keySecret) return null;
  return { keyId: org.keyId, keySecret, webhookSecret: await decryptSecret(org.webhookSecretEnc) };
}

async function rzp<T>(creds: { keyId: string; keySecret: string }, path: string, init?: { method?: string; body?: unknown }): Promise<{ ok: true; data: T } | { ok: false; status: number; error: string }> {
  const res = await fetch(`${API}${path}`, {
    method: init?.method ?? "GET",
    headers: {
      "Authorization": `Basic ${btoa(`${creds.keyId}:${creds.keySecret}`)}`,
      "Content-Type": "application/json",
    },
    body: init?.body ? JSON.stringify(init.body) : undefined,
  });
  const json = await res.json().catch(() => ({})) as { error?: { description?: string } };
  if (!res.ok) return { ok: false, status: res.status, error: json?.error?.description || `Razorpay error ${res.status}` };
  return { ok: true, data: json as T };
}

/** Check a key pair works (any authenticated read will do). */
export async function verifyRazorpayKeys(keyId: string, keySecret: string): Promise<{ ok: boolean; error?: string }> {
  const r = await rzp<unknown>({ keyId, keySecret }, "/payments?count=1");
  if (r.ok) return { ok: true };
  return { ok: false, error: r.status === 401 ? "Razorpay didn't accept this Key ID and Key Secret." : r.error };
}

async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, "0")).join("");
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function verifyHmac(secret: string, message: string, signature: string): Promise<boolean> {
  if (!signature || !/^[0-9a-f]{64}$/i.test(signature)) return false;
  return safeEqual(await hmacHex(secret, message), signature.toLowerCase());
}

export function razorpayWebhookUrl(event: H3Event, orgId: number): string {
  return `${appBaseUrl(event)}/api/webhooks/razorpay/${orgId}`;
}

interface RzpPaymentLink { id: string; short_url: string; status: string }
interface RzpPayment { id: string; amount: number; status: string; method?: string; order_id?: string; notes?: Record<string, string> }

/** Create a Razorpay Payment Link for a MemberBook pay link. reference_id ties it back to our token. */
export async function createRazorpayPaymentLink(creds: RazorpayCreds, input: {
  token: string;
  amount: number;
  description: string;
  memberName: string;
  memberPhone: string | null;
  callbackUrl: string;
}): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const contact = input.memberPhone ? normalizeIndianPhone(input.memberPhone) : null;
  const r = await rzp<RzpPaymentLink>(creds, "/payment_links", {
    method: "POST",
    body: {
      amount: input.amount,
      currency: "INR",
      accept_partial: false,
      description: input.description.slice(0, 2048),
      reference_id: `${input.token}.${Date.now().toString(36)}`,
      customer: { name: input.memberName.slice(0, 100), ...(contact ? { contact: `+${contact}` } : {}) },
      notify: { sms: false, email: false },
      reminder_enable: false,
      notes: { memberbook_token: input.token },
      callback_url: input.callbackUrl,
      callback_method: "get",
      expire_by: Math.floor(Date.now() / 1000) + 7 * 86400,
    },
  });
  if (!r.ok) return { ok: false, error: r.error };
  return { ok: true, url: r.data.short_url };
}

export async function fetchRazorpayPayment(creds: RazorpayCreds, paymentId: string) {
  if (!/^pay_[A-Za-z0-9]{6,40}$/.test(paymentId)) return null;
  const r = await rzp<RzpPayment>(creds, `/payments/${paymentId}`);
  return r.ok ? r.data : null;
}

function methodFor(rzpMethod: string | undefined): string {
  if (rzpMethod === "upi") return "upi";
  if (rzpMethod === "card" || rzpMethod === "emi") return "card";
  return "bank_transfer";
}

/** Our pay token from a Razorpay reference_id ("<token>.<suffix>"). */
export function tokenFromReference(ref: string | undefined | null): string | null {
  const t = String(ref ?? "").split(".")[0] ?? "";
  return /^[A-Za-z0-9_-]{10,40}$/.test(t) ? t : null;
}

/**
 * A Razorpay payment for one of our pay links was captured: record it once and
 * renew or settle the balance. The amount is taken from Razorpay, never from the browser.
 */
export async function recordRazorpayPayment(event: H3Event, orgId: number, token: string, payment: RzpPayment): Promise<{ ok: boolean; reason?: string }> {
  if (payment.status !== "captured") return { ok: false, reason: `payment ${payment.status}` };
  const data = await loadPayLink(token);
  if (!data || data.link.orgId !== orgId) return { ok: false, reason: "pay link not found" };
  await settleCollection(event, {
    orgId,
    subscriptionId: data.link.subscriptionId,
    kind: data.link.kind as "due" | "renewal",
    method: methodFor(payment.method),
    date: todayIST(),
    amount: payment.amount,
    online: true,
    externalRef: `razorpay:${payment.id}`,
    notes: `Paid online via Razorpay (${payment.id})`,
  });
  return { ok: true };
}
