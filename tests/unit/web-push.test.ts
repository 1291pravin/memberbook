// @vitest-environment node
import { createECDH, createHmac, createDecipheriv, randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { b64url, encryptPayload, fromB64url, vapidAuthHeader } from "../../server/utils/web-push";

const hmac = (key: Buffer, data: Buffer) => createHmac("sha256", key).update(data).digest();

// Browser-side decryption (RFC 8291), written independently of the sender.
function decrypt(body: Uint8Array, ua: ReturnType<typeof createECDH>, auth: Buffer) {
  const buf = Buffer.from(body);
  const salt = buf.subarray(0, 16);
  const idLen = buf[20]!;
  const asPublic = buf.subarray(21, 21 + idLen);
  const cipher = buf.subarray(21 + idLen);
  const secret = ua.computeSecret(asPublic);
  const prkKey = hmac(auth, secret);
  const ikm = hmac(prkKey, Buffer.concat([Buffer.from("WebPush: info\0"), ua.getPublicKey(), asPublic, Buffer.from([1])]));
  const prk = hmac(salt, ikm);
  const cek = hmac(prk, Buffer.from("Content-Encoding: aes128gcm\0\x01")).subarray(0, 16);
  const nonce = hmac(prk, Buffer.from("Content-Encoding: nonce\0\x01")).subarray(0, 12);
  const d = createDecipheriv("aes-128-gcm", cek, nonce);
  d.setAuthTag(cipher.subarray(cipher.length - 16));
  const plain = Buffer.concat([d.update(cipher.subarray(0, cipher.length - 16)), d.final()]);
  expect(plain[plain.length - 1]).toBe(2);
  return plain.subarray(0, -1).toString("utf8");
}

describe("web push", () => {
  it("encrypts a payload the browser can read", async () => {
    const ua = createECDH("prime256v1");
    ua.generateKeys();
    const auth = randomBytes(16);
    const text = JSON.stringify({ title: "WhatsApp: Ravi ✓", body: "Fees kitni hai?", url: "/admin/inbox?phone=919999999999" });
    const body = await encryptPayload(new TextEncoder().encode(text), { p256dh: b64url(ua.getPublicKey()), auth: b64url(auth) });
    expect(Buffer.from(body.subarray(16, 20)).readUInt32BE(0)).toBe(4096);
    expect(decrypt(body, ua, auth)).toBe(text);
  });

  it("signs a VAPID token for the push service's origin", async () => {
    const pair = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]) as CryptoKeyPair;
    const keys = {
      publicKey: b64url(await crypto.subtle.exportKey("raw", pair.publicKey) as ArrayBuffer),
      privateJwk: await crypto.subtle.exportKey("jwk", pair.privateKey) as JsonWebKey,
    };
    const header = await vapidAuthHeader("https://fcm.googleapis.com/fcm/send/abc", keys, Date.UTC(2026, 10, 23));
    const m = header.match(/^vapid t=([^,]+), k=(.+)$/);
    expect(m?.[2]).toBe(keys.publicKey);
    const [h, c, s] = m![1]!.split(".");
    const claims = JSON.parse(Buffer.from(fromB64url(c!)).toString());
    expect(claims.aud).toBe("https://fcm.googleapis.com");
    expect(claims.exp).toBe(Date.UTC(2026, 10, 23) / 1000 + 12 * 3600);
    const ok = await crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, pair.publicKey, fromB64url(s!), new TextEncoder().encode(`${h}.${c}`));
    expect(ok).toBe(true);
  });
});
