/**
 * Meta WhatsApp Cloud API: sends fee reminders from MemberBook's own business
 * number, with the gym's name inside each message.
 *
 * Off unless NUXT_WHATSAPP_CLOUD_ENABLED=true and the access token and phone
 * number id are set. Until then the app uses tap-to-send (wa.me links from the
 * owner's own phone).
 */

interface CloudConfig {
  enabled: boolean | string;
  accessToken: string;
  phoneNumberId: string;
  appSecret: string;
  webhookVerifyToken: string;
  templateName: string;
  templateLanguage: string;
  apiVersion: string;
}

export function getWhatsAppCloudConfig(): CloudConfig {
  return useRuntimeConfig().whatsappCloud as CloudConfig;
}

export function isWhatsAppCloudEnabled(): boolean {
  const c = getWhatsAppCloudConfig();
  const on = c.enabled === true || c.enabled === "true";
  return on && !!c.accessToken && !!c.phoneNumberId;
}

export interface TemplateSendResult {
  ok: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send the approved fee reminder template. Body variables, in order:
 * {{1}} member first name, {{2}} business name, {{3}} what is due
 * (e.g. "Monthly membership renewal"), {{4}} due date text, {{5}} amount.
 * The URL button's dynamic suffix is the pay link token (/pay/{{1}}).
 */
export async function sendFeeReminderTemplate(to: string, body: [string, string, string, string, string], payToken: string): Promise<TemplateSendResult> {
  const c = getWhatsAppCloudConfig();
  // Template variables may not contain newlines, tabs or 4+ spaces in a row.
  const clean = (s: string) => s.replace(/[\n\t]+/g, " ").replace(/ {4,}/g, "   ").trim().slice(0, 200);

  try {
    const res = await fetch(`https://graph.facebook.com/${c.apiVersion || "v22.0"}/${c.phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${c.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "template",
        template: {
          name: c.templateName || "fee_reminder",
          language: { code: c.templateLanguage || "en" },
          components: [
            { type: "body", parameters: body.map(text => ({ type: "text", text: clean(text) })) },
            { type: "button", sub_type: "url", index: "0", parameters: [{ type: "text", text: payToken }] },
          ],
        },
      }),
    });
    const data = await res.json().catch(() => ({})) as {
      messages?: { id: string }[];
      error?: { message?: string; code?: number };
    };
    if (!res.ok || !data.messages?.[0]?.id) {
      return { ok: false, error: `${data.error?.code ?? res.status}: ${data.error?.message ?? "Unknown error"}`.slice(0, 500) };
    }
    return { ok: true, messageId: data.messages[0].id };
  }
  catch (err) {
    return { ok: false, error: String(err).slice(0, 500) };
  }
}

/** Verify Meta's X-Hub-Signature-256 header (HMAC-SHA256 of the raw body with the app secret). */
export async function verifyMetaSignature(rawBody: string, header: string | undefined): Promise<boolean> {
  const secret = getWhatsAppCloudConfig().appSecret;
  if (!secret || !header?.startsWith("sha256=")) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  const expected = [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, "0")).join("");
  const given = header.slice("sha256=".length);
  if (given.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ given.charCodeAt(i);
  return diff === 0;
}

/** Has the Cloud API got what it needs to send (token + phone number id), regardless of the reminders switch? */
export function canSendWhatsAppCloud(): boolean {
  const c = getWhatsAppCloudConfig();
  return !!c.accessToken && !!c.phoneNumberId;
}

/**
 * Send a free-form text reply from the inbox. WhatsApp only allows this within
 * 24 hours of the person's last message to us (the customer service window).
 */
export async function sendWhatsAppText(to: string, text: string): Promise<TemplateSendResult> {
  const c = getWhatsAppCloudConfig();
  try {
    const res = await fetch(`https://graph.facebook.com/${c.apiVersion || "v22.0"}/${c.phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${c.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: { preview_url: false, body: text.slice(0, 4096) },
      }),
    });
    const data = await res.json().catch(() => ({})) as {
      messages?: { id: string }[];
      error?: { message?: string; code?: number };
    };
    if (!res.ok || !data.messages?.[0]?.id) {
      return { ok: false, error: `${data.error?.code ?? res.status}: ${data.error?.message ?? "Unknown error"}`.slice(0, 500) };
    }
    return { ok: true, messageId: data.messages[0].id };
  }
  catch (err) {
    return { ok: false, error: String(err).slice(0, 500) };
  }
}

/** A readable one-line body for an incoming WhatsApp message of any type. */
export interface IncomingWhatsAppMessage {
  id?: string;
  from?: string;
  timestamp?: string;
  type?: string;
  text?: { body?: string };
  button?: { text?: string };
  interactive?: { button_reply?: { title?: string }; list_reply?: { title?: string } };
  image?: { caption?: string };
  video?: { caption?: string };
  document?: { filename?: string };
  location?: { name?: string; latitude?: number; longitude?: number };
  reaction?: { emoji?: string };
}

export function describeIncomingMessage(m: IncomingWhatsAppMessage): string {
  switch (m.type) {
    case "text": return String(m.text?.body ?? "");
    case "button": return String(m.button?.text ?? "[button]");
    case "interactive": return String(m.interactive?.button_reply?.title ?? m.interactive?.list_reply?.title ?? "[interactive reply]");
    case "image": return m.image?.caption ? `[image] ${m.image.caption}` : "[image]";
    case "video": return m.video?.caption ? `[video] ${m.video.caption}` : "[video]";
    case "document": return `[document] ${m.document?.filename ?? ""}`.trim();
    case "audio": return "[voice note]";
    case "sticker": return "[sticker]";
    case "location": return `[location] ${m.location?.name ?? ""} ${m.location?.latitude ?? ""},${m.location?.longitude ?? ""}`.trim();
    case "contacts": return "[contact card]";
    case "reaction": return `[reaction ${m.reaction?.emoji ?? ""}]`;
    default: return `[${m.type ?? "unknown"} message]`;
  }
}

interface GraphError {
  error?: {
    message?: string;
    code?: number;
    error_subcode?: number;
    error_user_title?: string;
    error_user_msg?: string;
    error_data?: { details?: string } | string;
  };
}

async function graph<T>(path: string, init?: { method?: string; body?: unknown }): Promise<{ ok: boolean; data: T & GraphError; status: number }> {
  const c = getWhatsAppCloudConfig();
  const res = await fetch(`https://graph.facebook.com/${c.apiVersion || "v22.0"}/${path}`, {
    method: init?.method ?? "GET",
    headers: {
      "Authorization": `Bearer ${c.accessToken}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
    },
    body: init?.body ? JSON.stringify(init.body) : undefined,
  });
  const data = await res.json().catch(() => ({})) as T & GraphError;
  return { ok: res.ok && !data.error, data, status: res.status };
}

function graphError(r: { data: GraphError; status: number }): string {
  const e = r.data.error;
  const details = typeof e?.error_data === "string" ? e.error_data : e?.error_data?.details;
  const extra = [e?.error_subcode ? `subcode ${e.error_subcode}` : "", e?.error_user_title, e?.error_user_msg, details]
    .filter(Boolean).join(" | ");
  return `${e?.code ?? r.status}: ${e?.message ?? "Unknown error"}${extra ? ` (${extra})` : ""}`.slice(0, 800);
}

export interface PhoneNumberStatus {
  ok: boolean;
  error?: string;
  phoneNumberId?: string;
  displayPhoneNumber?: string;
  verifiedName?: string;
  nameStatus?: string;
  status?: string;
  platformType?: string;
  qualityRating?: string;
  businessAccountId?: string | null;
  webhooksSubscribed?: boolean | null;
}

/** Find the WhatsApp Business Account that owns our phone number, from the token's granted scopes. */
async function findBusinessAccountId(): Promise<string | null> {
  const c = getWhatsAppCloudConfig();
  const debug = await graph<{ data?: { granular_scopes?: { scope: string; target_ids?: string[] }[] } }>(
    `debug_token?input_token=${encodeURIComponent(c.accessToken)}`,
  );
  const ids = new Set<string>();
  for (const s of debug.data.data?.granular_scopes ?? []) {
    if (s.scope.startsWith("whatsapp_business")) s.target_ids?.forEach(id => ids.add(id));
  }
  for (const id of ids) {
    const nums = await graph<{ data?: { id: string }[] }>(`${id}/phone_numbers?fields=id`);
    if (nums.data.data?.some(n => n.id === c.phoneNumberId)) return id;
  }
  return null;
}

/** Current state of the business number in Meta (registration, display name review, webhook link). */
export async function getPhoneNumberStatus(): Promise<PhoneNumberStatus> {
  const c = getWhatsAppCloudConfig();
  if (!canSendWhatsAppCloud()) return { ok: false, error: "Access token or phone number ID is not set" };
  try {
    const r = await graph<{
      id?: string; display_phone_number?: string; verified_name?: string; name_status?: string;
      status?: string; platform_type?: string; quality_rating?: string;
    }>(`${c.phoneNumberId}?fields=display_phone_number,verified_name,name_status,status,platform_type,quality_rating`);
    if (!r.ok) return { ok: false, error: graphError(r) };

    const businessAccountId = await findBusinessAccountId().catch(() => null);
    let webhooksSubscribed: boolean | null = null;
    if (businessAccountId) {
      const subs = await graph<{ data?: unknown[] }>(`${businessAccountId}/subscribed_apps`);
      webhooksSubscribed = subs.ok ? (subs.data.data?.length ?? 0) > 0 : null;
    }
    return {
      ok: true,
      phoneNumberId: r.data.id,
      displayPhoneNumber: r.data.display_phone_number,
      verifiedName: r.data.verified_name,
      nameStatus: r.data.name_status,
      status: r.data.status,
      platformType: r.data.platform_type,
      qualityRating: r.data.quality_rating,
      businessAccountId,
      webhooksSubscribed,
    };
  }
  catch (err) {
    return { ok: false, error: String(err).slice(0, 500) };
  }
}

/**
 * Register the number for the Cloud API (sets its two-step verification PIN)
 * and subscribe our app to its account's webhooks, so incoming messages and
 * delivery receipts reach /api/webhooks/whatsapp.
 */
export async function registerPhoneNumber(pin: string): Promise<{ ok: boolean; error?: string; subscribed?: boolean }> {
  const c = getWhatsAppCloudConfig();
  if (!canSendWhatsAppCloud()) return { ok: false, error: "Access token or phone number ID is not set" };
  try {
    const reg = await graph<{ success?: boolean }>(`${c.phoneNumberId}/register`, {
      method: "POST",
      body: { messaging_product: "whatsapp", pin },
    });
    if (!reg.ok) return { ok: false, error: graphError(reg) };

    const wabaId = await findBusinessAccountId().catch(() => null);
    if (!wabaId) return { ok: true, subscribed: false, error: "Registered, but could not find the WhatsApp account to subscribe webhooks" };
    const sub = await graph<{ success?: boolean }>(`${wabaId}/subscribed_apps`, { method: "POST" });
    if (!sub.ok) return { ok: true, subscribed: false, error: `Registered, but webhook subscription failed: ${graphError(sub)}` };
    return { ok: true, subscribed: true };
  }
  catch (err) {
    return { ok: false, error: String(err).slice(0, 500) };
  }
}
