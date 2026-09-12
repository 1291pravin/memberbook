/** Normalize optional contact details without treating a supplied number as consent. */
export function parseOrgContact(phone: unknown, consent: unknown) {
  if (consent !== undefined && typeof consent !== "boolean") {
    throw new Error("Setup help consent must be true or false");
  }
  if (phone !== undefined && phone !== null && typeof phone !== "string") {
    throw new Error("Enter a valid WhatsApp number");
  }
  const raw = typeof phone === "string" ? phone.trim() : "";
  let normalized: string | null = null;
  if (raw) {
    if (raw.length > 40 || !/^[+\d\s()-]+$/.test(raw)) {
      throw new Error("Enter a valid WhatsApp number with country code");
    }
    const compact = raw.replace(/[\s()-]/g, "");
    normalized = /^\d{10}$/.test(compact) ? `+91${compact}` : compact;
    if (!/^\+[1-9]\d{7,14}$/.test(normalized)) {
      throw new Error("Enter a valid WhatsApp number with country code, such as +91 98765 43210");
    }
    if (normalized.startsWith("+91") && !/^\+91[6-9]\d{9}$/.test(normalized)) {
      throw new Error("Enter a valid 10-digit Indian mobile number");
    }
  }
  if (consent === true && !normalized) {
    throw new Error("Add a WhatsApp number to request setup help");
  }
  return { ownerWhatsapp: normalized, setupHelpConsentAt: consent === true ? new Date().toISOString() : null };
}
