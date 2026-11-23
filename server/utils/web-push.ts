import type { H3Event } from "h3";
import { db, schema } from "@nuxthub/db";
import { eq } from "drizzle-orm";

/**
 * Web Push alerts to the admin's phone (the /admin inbox added to the home
 * screen). Standard Web Push (RFC 8030/8291/8292) with WebCrypto only, so it
 * runs on Cloudflare Workers with no library.
 *
 * The VAPID key pair is made on first use and kept in app_settings, so there is
 * no secret to set up. Changing it would cut off every saved subscription.
 */

const VAPID_KEY = "vapid_keys";
const SUBJECT = "mailto:support@memberbook.in";

export interface PushMessage {
  title: string;
  body: string;
  /** Page to open when the alert is tapped, e.g. /admin/inbox?phone=91... */
  url: string;
  /** Alerts with the same tag replace each other (one per chat). */
  tag?: string;
}

// ---------------------------------------------------------------------------
// base64url helpers
// ---------------------------------------------------------------------------

export function b64url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  for (const b of arr) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function fromB64url(text: string): Uint8Array<ArrayBuffer> {
  const s = text.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(s + "=".repeat((4 - (s.length % 4)) % 4));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function concat(...parts: Uint8Array[]): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

const enc = new TextEncoder();

async function hmac(key: Uint8Array<ArrayBuffer>, data: Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer>> {
  const k = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", k, data));
}

// ---------------------------------------------------------------------------
// VAPID keys and JWT (RFC 8292)
// ---------------------------------------------------------------------------

interface VapidKeys { publicKey: string; privateJwk: JsonWebKey }

async function makeVapidKeys(): Promise<VapidKeys> {
  const pair = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]) as CryptoKeyPair;
  const raw = await crypto.subtle.exportKey("raw", pair.publicKey) as ArrayBuffer;
  const privateJwk = await crypto.subtle.exportKey("jwk", pair.privateKey) as JsonWebKey;
  return { publicKey: b64url(raw), privateJwk };
}

export async function getVapidKeys(): Promise<VapidKeys> {
  const read = async () => {
    const [row] = await db.select({ value: schema.appSettings.value }).from(schema.appSettings)
      .where(eq(schema.appSettings.key, VAPID_KEY)).limit(1);
    return row ? JSON.parse(row.value) as VapidKeys : null;
  };
  const existing = await read();
  if (existing) return existing;
  const fresh = await makeVapidKeys();
  // Two first requests at once: the first insert wins and both use its keys.
  await db.insert(schema.appSettings).values({ key: VAPID_KEY, value: JSON.stringify(fresh), updatedAt: new Date().toISOString() })
    .onConflictDoNothing();
  return (await read()) ?? fresh;
}

export async function vapidAuthHeader(endpoint: string, keys: VapidKeys, now = Date.now()): Promise<string> {
  const aud = new URL(endpoint).origin;
  const header = b64url(enc.encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const claims = b64url(enc.encode(JSON.stringify({ aud, exp: Math.floor(now / 1000) + 12 * 3600, sub: SUBJECT })));
  const key = await crypto.subtle.importKey("jwk", keys.privateJwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  // WebCrypto gives the raw r||s signature, which is what JWS ES256 wants.
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, enc.encode(`${header}.${claims}`));
  return `vapid t=${header}.${claims}.${b64url(sig)}, k=${keys.publicKey}`;
}

// ---------------------------------------------------------------------------
// Payload encryption (RFC 8291, aes128gcm)
// ---------------------------------------------------------------------------

export async function encryptPayload(
  payload: Uint8Array,
  sub: { p256dh: string; auth: string },
  opts: { salt?: Uint8Array<ArrayBuffer>; serverKeys?: CryptoKeyPair } = {},
): Promise<Uint8Array<ArrayBuffer>> {
  const uaPublic = fromB64url(sub.p256dh);
  const authSecret = fromB64url(sub.auth);
  const salt = opts.salt ?? crypto.getRandomValues(new Uint8Array(16));
  const server = opts.serverKeys ?? await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]) as CryptoKeyPair;
  const asPublic = new Uint8Array(await crypto.subtle.exportKey("raw", server.publicKey) as ArrayBuffer);

  const uaKey = await crypto.subtle.importKey("raw", uaPublic, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const ecdhSecret = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: uaKey }, server.privateKey, 256));

  const prkKey = await hmac(authSecret, ecdhSecret);
  const keyInfo = concat(enc.encode("WebPush: info\0"), uaPublic, asPublic, new Uint8Array([1]));
  const ikm = await hmac(prkKey, keyInfo);
  const prk = await hmac(salt, ikm);
  const cek = (await hmac(prk, concat(enc.encode("Content-Encoding: aes128gcm\0"), new Uint8Array([1])))).slice(0, 16);
  const nonce = (await hmac(prk, concat(enc.encode("Content-Encoding: nonce\0"), new Uint8Array([1])))).slice(0, 12);

  const aesKey = await crypto.subtle.importKey("raw", cek, { name: "AES-GCM" }, false, ["encrypt"]);
  // One record: payload, then the 0x02 "last record" delimiter, no padding.
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, aesKey, concat(payload, new Uint8Array([2]))));

  const rs = new Uint8Array([0, 0, 16, 0]); // record size 4096
  return concat(salt, rs, new Uint8Array([asPublic.length]), asPublic, cipher);
}

// ---------------------------------------------------------------------------
// Sending
// ---------------------------------------------------------------------------

/** Send one alert to every saved admin device. Never throws. */
export async function sendAdminPush(msg: PushMessage): Promise<{ sent: number; failed: number; removed: number }> {
  const result = { sent: 0, failed: 0, removed: 0 };
  try {
    const subs = await db.select().from(schema.pushSubscriptions);
    if (!subs.length) return result;
    const keys = await getVapidKeys();
    const payload = enc.encode(JSON.stringify({
      title: msg.title.slice(0, 120),
      body: msg.body.slice(0, 300),
      url: msg.url,
      tag: msg.tag,
    }));

    await Promise.all(subs.map(async (s) => {
      try {
        const body = await encryptPayload(payload, { p256dh: s.p256dh, auth: s.auth });
        const res = await fetch(s.endpoint, {
          method: "POST",
          headers: {
            "Authorization": await vapidAuthHeader(s.endpoint, keys),
            "Content-Encoding": "aes128gcm",
            "Content-Type": "application/octet-stream",
            "TTL": "86400",
            "Urgency": "high",
          },
          body,
        });
        if (res.status === 404 || res.status === 410) {
          // The phone dropped this subscription (app removed, alerts turned off).
          await db.delete(schema.pushSubscriptions).where(eq(schema.pushSubscriptions.id, s.id));
          result.removed++;
        }
        else if (res.ok) {
          result.sent++;
          await db.update(schema.pushSubscriptions).set({ lastSentAt: new Date().toISOString(), lastError: null })
            .where(eq(schema.pushSubscriptions.id, s.id));
        }
        else {
          result.failed++;
          const text = (await res.text().catch(() => "")).slice(0, 200);
          await db.update(schema.pushSubscriptions).set({ lastError: `${res.status} ${text}`.trim() })
            .where(eq(schema.pushSubscriptions.id, s.id));
        }
      }
      catch (err) {
        result.failed++;
        console.error("[web-push] send failed", err);
      }
    }));
  }
  catch (err) {
    console.error("[web-push] failed", err);
  }
  return result;
}

/** Run a push in the background of a request when the platform allows it. */
export function pushInBackground(event: H3Event, msg: PushMessage) {
  const job = sendAdminPush(msg).then(() => undefined);
  const ctx = event.context.cloudflare?.context as { waitUntil?: (p: Promise<unknown>) => void } | undefined;
  if (ctx?.waitUntil) ctx.waitUntil(job);
  else if (typeof event.waitUntil === "function") event.waitUntil(job);
}
