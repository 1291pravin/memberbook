import { and, eq } from "drizzle-orm";
import { db, schema } from "@nuxthub/db";
import type { WhatsAppSender } from "./whatsapp-cloud";

/**
 * A business's own WhatsApp number, connected with Meta's embedded signup
 * ("Connect with WhatsApp"). MemberBook is a Tech Provider on the business's
 * WhatsApp Business account: the business keeps owning the account and the
 * number, and we get a business token that can send from it.
 *
 * Behind the `own_number` add-on (admin feature flag until it opens to all).
 */

type OwnAccount = typeof schema.orgWhatsappAccounts.$inferSelect;

const API = () => `https://graph.facebook.com/${getWhatsAppCloudConfig().apiVersion || "v22.0"}`;

// ------------------------------------------------------------ token crypto

let keyCache: { secret: string; key: CryptoKey } | null = null;

/** AES-GCM key for stored tokens: NUXT_WHATSAPP_CLOUD_TOKEN_KEY, else derived from the session password. */
async function tokenKey(): Promise<CryptoKey> {
  const config = useRuntimeConfig() as unknown as { whatsappCloud?: { tokenKey?: string }; session?: { password?: string } };
  const secret = String(config.whatsappCloud?.tokenKey || config.session?.password || "");
  if (secret.length < 16) throw createError({ statusCode: 500, statusMessage: "Token encryption key is not set" });
  if (keyCache?.secret === secret) return keyCache.key;
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), "HKDF", false, ["deriveKey"]);
  const key = await crypto.subtle.deriveKey(
    { name: "HKDF", hash: "SHA-256", salt: new TextEncoder().encode("memberbook-whatsapp-token"), info: new Uint8Array() },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
  keyCache = { secret, key };
  return key;
}

const toB64 = (b: Uint8Array) => btoa(String.fromCharCode(...b));
const fromB64 = (s: string) => Uint8Array.from(atob(s), c => c.charCodeAt(0));

export async function encryptSecret(plain: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await tokenKey(), new TextEncoder().encode(plain));
  return `v1.${toB64(iv)}.${toB64(new Uint8Array(enc))}`;
}

export async function decryptSecret(stored: string | null | undefined): Promise<string | null> {
  if (!stored?.startsWith("v1.")) return null;
  const [, iv, data] = stored.split(".");
  try {
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromB64(iv!) }, await tokenKey(), fromB64(data!));
    return new TextDecoder().decode(plain);
  }
  catch {
    return null;
  }
}

// ------------------------------------------------------------ graph helpers

interface GraphErr { error?: { message?: string; code?: number; error_subcode?: number; error_user_msg?: string } }

async function graphCall<T>(path: string, token: string, init?: { method?: string; body?: unknown }) {
  const res = await fetch(`${API()}/${path}`, {
    method: init?.method ?? "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
    },
    body: init?.body ? JSON.stringify(init.body) : undefined,
  });
  const data = await res.json().catch(() => ({})) as T & GraphErr;
  const ok = res.ok && !data.error;
  const error = ok ? undefined : `${data.error?.code ?? res.status}: ${data.error?.error_user_msg || data.error?.message || "Unknown error"}`.slice(0, 500);
  return { ok, data, error };
}

/** Public settings the browser needs to open Meta's signup popup. */
export function embeddedSignupConfig() {
  const config = useRuntimeConfig();
  const pub = (config.public as { whatsappSignup?: { appId?: string; configId?: string } }).whatsappSignup ?? {};
  const appId = String(pub.appId || getWhatsAppCloudConfig().appId || "");
  const configId = String(pub.configId || "");
  return { appId, configId, ready: Boolean(appId && configId && getWhatsAppCloudConfig().appSecret) };
}

/** Swap the one-time code from the signup popup for the business's token. */
async function exchangeCode(code: string): Promise<{ ok: boolean; token?: string; error?: string }> {
  const { appId } = embeddedSignupConfig();
  const secret = getWhatsAppCloudConfig().appSecret;
  const url = `${API()}/oauth/access_token?client_id=${encodeURIComponent(appId)}&client_secret=${encodeURIComponent(secret)}&code=${encodeURIComponent(code)}`;
  const res = await fetch(url);
  const data = await res.json().catch(() => ({})) as { access_token?: string } & GraphErr;
  if (!res.ok || !data.access_token) return { ok: false, error: `${data.error?.code ?? res.status}: ${data.error?.message ?? "Could not exchange the code"}` };
  return { ok: true, token: data.access_token };
}

/** Does this token really cover this WhatsApp account? Stops anyone attaching a WABA they didn't just grant. */
async function tokenCoversWaba(token: string, wabaId: string): Promise<boolean> {
  const c = getWhatsAppCloudConfig();
  const { appId } = embeddedSignupConfig();
  const r = await graphCall<{ data?: { app_id?: string; is_valid?: boolean; granular_scopes?: { scope: string; target_ids?: string[] }[] } }>(
    `debug_token?input_token=${encodeURIComponent(token)}`,
    `${appId}|${c.appSecret}`,
  );
  const d = r.data.data;
  if (!r.ok || !d?.is_valid || (d.app_id && d.app_id !== appId)) return false;
  return (d.granular_scopes ?? []).some(s => s.scope.startsWith("whatsapp_business") && (s.target_ids ?? []).includes(wabaId));
}

/** Body of the fee reminder template, the same one MemberBook's own number uses. */
function feeReminderTemplate(name: string, language: string, appUrl: string) {
  return {
    name,
    language,
    category: "UTILITY",
    components: [
      {
        type: "BODY",
        text: "Hi {{1}}, this is a reminder from {{2}}. Your {{3}} is due {{4}}. Amount: {{5}}. Tap the button below to pay by UPI. Please ignore this if you have already paid.",
        example: { body_text: [["Rahul", "Iron Temple Gym", "Monthly membership renewal", "on 14 Nov", "₹1,500"]] },
      },
      {
        type: "BUTTONS",
        buttons: [{ type: "URL", text: "Pay now", url: `${appUrl}/pay/{{1}}`, example: [`${appUrl}/pay/abc123`] }],
      },
    ],
  };
}

/** Create the reminder template on the business's account, or read its status if it is already there. */
async function ensureTemplate(token: string, wabaId: string, name: string, language: string, appUrl: string) {
  const existing = await graphCall<{ data?: { name: string; language: string; status: string }[] }>(
    `${wabaId}/message_templates?name=${encodeURIComponent(name)}&fields=name,language,status`,
    token,
  );
  const found = existing.data.data?.find(t => t.name === name && t.language === language);
  if (found) return { ok: true, status: found.status };

  const created = await graphCall<{ id?: string; status?: string }>(`${wabaId}/message_templates`, token, {
    method: "POST",
    body: feeReminderTemplate(name, language, appUrl),
  });
  if (!created.ok) return { ok: false, status: "ERROR", error: created.error };
  return { ok: true, status: created.data.status || "PENDING" };
}

/**
 * Give MemberBook's own system user (the permanent token in
 * NUXT_WHATSAPP_CLOUD_ACCESS_TOKEN) access to a business's WhatsApp account.
 * The token from embedded signup expires after 60 days; ours doesn't.
 */
async function assignOurSystemUser(wabaId: string): Promise<{ ok: boolean; error?: string }> {
  const ours = getWhatsAppCloudConfig().accessToken;
  if (!ours) return { ok: false, error: "MemberBook's own token is not set" };
  const me = await graphCall<{ id?: string }>("me?fields=id", ours);
  if (!me.ok || !me.data.id) return { ok: false, error: me.error ?? "Could not read our system user" };
  const tasks = encodeURIComponent(JSON.stringify(["MANAGE"]));
  const r = await graphCall<{ success?: boolean }>(`${wabaId}/assigned_users?user=${me.data.id}&tasks=${tasks}`, ours, { method: "POST" });
  return r.ok ? { ok: true } : { ok: false, error: r.error };
}

/** The token to use for a business's account: ours once assigned, else the signup token. */
async function tokenFor(account: OwnAccount): Promise<string | null> {
  if (account.status === "disconnected") return null;
  const ours = getWhatsAppCloudConfig().accessToken;
  if (account.partnerAccess && ours) return ours;
  return decryptSecret(account.accessTokenEnc);
}

// ------------------------------------------------------------ public API

export async function getOwnAccount(orgId: number): Promise<OwnAccount | null> {
  const [row] = await db.select().from(schema.orgWhatsappAccounts).where(eq(schema.orgWhatsappAccounts.orgId, orgId)).limit(1);
  return row ?? null;
}

/** What the owner sees about their connection. Never includes the token. */
export function serializeOwnAccount(a: OwnAccount | null) {
  if (!a) return null;
  return {
    status: a.status,
    displayPhoneNumber: a.displayPhoneNumber,
    verifiedName: a.verifiedName,
    businessApp: a.businessApp,
    templateStatus: a.templateStatus,
    lastError: a.lastError,
    connectedAt: a.connectedAt,
    ready: a.status === "connected" && a.templateStatus === "APPROVED" && (!!a.accessTokenEnc || a.partnerAccess),
  };
}

/**
 * The sender for this business's automatic reminders: its own number when the
 * add-on is on, the number is connected and the template is approved. Null
 * means "use MemberBook's number" (if that is switched on).
 */
export async function getOwnSender(orgId: number): Promise<(WhatsAppSender & { displayPhoneNumber: string | null }) | null> {
  const account = await getOwnAccount(orgId);
  if (!account || account.status !== "connected" || account.templateStatus !== "APPROVED") return null;
  if (!(await isAddOnActive(orgId, "own_number"))) return null;
  const accessToken = await tokenFor(account);
  if (!accessToken) return null;
  return {
    phoneNumberId: account.phoneNumberId,
    accessToken,
    templateName: account.templateName,
    templateLanguage: account.templateLanguage,
    displayPhoneNumber: account.displayPhoneNumber,
  };
}

export type ReminderBlock = "limit" | "unpaid";

export interface ReminderSending {
  /** Automatic reminders can be switched on for this business. */
  available: boolean;
  via: "own" | "memberbook" | null;
  sender: WhatsAppSender | undefined;
  displayPhoneNumber: string | null;
  /** MemberBook's number is live but the business hasn't switched on the auto_reminders add-on. */
  needsAddOn: boolean;
  /** Shared-number usage this month (null when sending from their own number). */
  usage: { used: number; limit: number } | null;
  /** Set when sending is paused: not paid upfront (or payment not verified yet), or monthly limit reached. */
  blocked: ReminderBlock | null;
  /** Prepaid through this IST date (shared number only). */
  paidUntil: string | null;
}

/**
 * How automatic reminders go out for this business, if at all: from its own
 * connected number (own_number add-on; Meta bills the business), else from
 * MemberBook's number, which needs the auto_reminders add-on paid upfront
 * (verified by the admin) and stays within INCLUDED_REMINDERS a month (Meta
 * bills us per message, so there is no free month).
 */
export async function reminderSending(orgId: number): Promise<ReminderSending> {
  const own = await getOwnSender(orgId);
  if (own) {
    return { available: true, via: "own", sender: own, displayPhoneNumber: own.displayPhoneNumber, needsAddOn: false, usage: null, blocked: null, paidUntil: null };
  }
  if (!isWhatsAppCloudEnabled()) {
    return { available: false, via: null, sender: undefined, displayPhoneNumber: null, needsAddOn: false, usage: null, blocked: null, paidUntil: null };
  }
  const [plan, used] = await Promise.all([isPrepaidAddOnPaid(orgId, "auto_reminders"), sharedRemindersThisMonth(orgId)]);
  if (!plan.active) {
    return { available: false, via: null, sender: undefined, displayPhoneNumber: null, needsAddOn: true, usage: null, blocked: null, paidUntil: plan.paidUntil };
  }
  const blocked: ReminderBlock | null = !plan.paid ? "unpaid" : used >= INCLUDED_REMINDERS ? "limit" : null;
  return {
    available: true,
    via: "memberbook",
    sender: undefined,
    displayPhoneNumber: null,
    needsAddOn: false,
    usage: { used, limit: INCLUDED_REMINDERS },
    blocked,
    paidUntil: plan.paidUntil,
  };
}

function randomPin() {
  const n = crypto.getRandomValues(new Uint32Array(1))[0]! % 1000000;
  return String(n).padStart(6, "0");
}

/**
 * Finish embedded signup: swap the code for a token, check it covers the
 * account, link webhooks, register a new number, create the reminder template
 * and save it all.
 */
export async function connectOwnAccount(opts: {
  orgId: number;
  userId: number | null;
  code: string;
  wabaId: string;
  phoneNumberId: string;
  businessApp: boolean;
  appUrl: string;
}): Promise<OwnAccount> {
  const exchanged = await exchangeCode(opts.code);
  if (!exchanged.ok || !exchanged.token) {
    throw createError({ statusCode: 502, statusMessage: `Meta did not finish the connection (${exchanged.error}). Please try again.` });
  }
  const token = exchanged.token;

  if (!(await tokenCoversWaba(token, opts.wabaId))) {
    throw createError({ statusCode: 403, statusMessage: "This WhatsApp account wasn't shared with MemberBook. Please try again and tick it in the Meta window." });
  }

  // The number must belong to that account.
  const nums = await graphCall<{ data?: { id: string; display_phone_number?: string; verified_name?: string; status?: string }[] }>(
    `${opts.wabaId}/phone_numbers?fields=id,display_phone_number,verified_name,status`,
    token,
  );
  const phone = nums.data.data?.find(n => n.id === opts.phoneNumberId);
  if (!phone) {
    throw createError({ statusCode: 400, statusMessage: "That phone number isn't in the WhatsApp account you shared. Please try again." });
  }

  const errors: string[] = [];

  // Long-term access with our own permanent token.
  const partner = await assignOurSystemUser(opts.wabaId);
  if (!partner.ok) errors.push(`Partner access: ${partner.error}`);

  // Incoming messages and delivery ticks for this account come to our webhook.
  const sub = await graphCall<{ success?: boolean }>(`${opts.wabaId}/subscribed_apps`, token, { method: "POST" });
  if (!sub.ok) errors.push(`Webhooks: ${sub.error}`);

  // A new number has to be registered for the Cloud API. A number that stays
  // on the WhatsApp Business app (coexistence) is registered by Meta already.
  let pinEnc: string | null = null;
  if (!opts.businessApp) {
    const pin = randomPin();
    const reg = await graphCall<{ success?: boolean }>(`${opts.phoneNumberId}/register`, token, {
      method: "POST",
      body: { messaging_product: "whatsapp", pin },
    });
    if (reg.ok) pinEnc = await encryptSecret(pin);
    else errors.push(`Register: ${reg.error}`);
  }

  const templateName = getWhatsAppCloudConfig().templateName || "fee_reminder";
  const templateLanguage = getWhatsAppCloudConfig().templateLanguage || "en";
  const tpl = await ensureTemplate(token, opts.wabaId, templateName, templateLanguage, opts.appUrl);
  if (!tpl.ok) errors.push(`Template: ${tpl.error}`);

  const now = new Date().toISOString();
  const values = {
    wabaId: opts.wabaId,
    phoneNumberId: opts.phoneNumberId,
    displayPhoneNumber: phone.display_phone_number ?? null,
    verifiedName: phone.verified_name ?? null,
    businessApp: opts.businessApp,
    accessTokenEnc: await encryptSecret(token),
    pinEnc,
    partnerAccess: partner.ok,
    status: "connected",
    templateName,
    templateLanguage,
    templateStatus: tpl.status,
    lastError: errors.length ? errors.join(" | ").slice(0, 1000) : null,
    connectedBy: opts.userId,
    connectedAt: now,
    updatedAt: now,
  };
  const [row] = await db.insert(schema.orgWhatsappAccounts)
    .values({ orgId: opts.orgId, ...values, createdAt: now })
    .onConflictDoUpdate({ target: schema.orgWhatsappAccounts.orgId, set: values })
    .returning();
  return row!;
}

/** Re-read the number and template status from Meta (the owner taps "Check again", or after a webhook). */
export async function refreshOwnAccount(orgId: number, appUrl: string): Promise<OwnAccount | null> {
  const account = await getOwnAccount(orgId);
  if (!account || account.status === "disconnected") return account;
  const token = await tokenFor(account);
  if (!token) return account;

  const errors: string[] = [];
  const phone = await graphCall<{ display_phone_number?: string; verified_name?: string }>(
    `${account.phoneNumberId}?fields=display_phone_number,verified_name`,
    token,
  );
  if (!phone.ok) errors.push(`Number: ${phone.error}`);

  const tpl = await ensureTemplate(token, account.wabaId, account.templateName, account.templateLanguage, appUrl);
  if (!tpl.ok) errors.push(`Template: ${tpl.error}`);

  // A 190 error means the business removed MemberBook or the token died.
  const tokenDead = [phone.error, tpl.error].some(e => e?.startsWith("190:"));

  const [row] = await db.update(schema.orgWhatsappAccounts).set({
    displayPhoneNumber: phone.data.display_phone_number ?? account.displayPhoneNumber,
    verifiedName: phone.data.verified_name ?? account.verifiedName,
    templateStatus: tpl.ok ? tpl.status : account.templateStatus,
    status: tokenDead ? "error" : account.status,
    lastError: errors.length ? errors.join(" | ").slice(0, 1000) : null,
    updatedAt: new Date().toISOString(),
  }).where(eq(schema.orgWhatsappAccounts.id, account.id)).returning();
  return row ?? account;
}

/** Forget the business's number: drop the token and go back to MemberBook's number or tap-to-send. */
export async function disconnectOwnAccount(orgId: number) {
  await db.update(schema.orgWhatsappAccounts).set({
    status: "disconnected",
    accessTokenEnc: null,
    partnerAccess: false,
    updatedAt: new Date().toISOString(),
  }).where(eq(schema.orgWhatsappAccounts.orgId, orgId));
}

/** Webhook: Meta says a template on some business's account changed status. */
export async function updateOwnTemplateStatus(wabaId: string, templateName: string, status: string) {
  await db.update(schema.orgWhatsappAccounts)
    .set({ templateStatus: status.toUpperCase().slice(0, 40), updatedAt: new Date().toISOString() })
    .where(and(eq(schema.orgWhatsappAccounts.wabaId, wabaId), eq(schema.orgWhatsappAccounts.templateName, templateName)));
}

/** Webhook: the business removed MemberBook from its WhatsApp account in Meta. */
export async function markOwnAccountRemoved(wabaId: string) {
  await db.update(schema.orgWhatsappAccounts)
    .set({ status: "disconnected", accessTokenEnc: null, partnerAccess: false, lastError: "Removed in Meta by the business", updatedAt: new Date().toISOString() })
    .where(eq(schema.orgWhatsappAccounts.wabaId, wabaId));
}

/** Is this phone number id one of the businesses' own numbers (not MemberBook's)? */
export async function isOwnBusinessNumber(phoneNumberId: string | undefined) {
  if (!phoneNumberId || phoneNumberId === getWhatsAppCloudConfig().phoneNumberId) return false;
  const [row] = await db.select({ id: schema.orgWhatsappAccounts.id }).from(schema.orgWhatsappAccounts)
    .where(eq(schema.orgWhatsappAccounts.phoneNumberId, phoneNumberId)).limit(1);
  return Boolean(row);
}
