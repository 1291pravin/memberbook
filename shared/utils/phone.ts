/**
 * Normalize an Indian phone number to 10-digit format.
 * Accepts: 9876543210, 09876543210, +919876543210, 919876543210
 * Returns normalized 10-digit string or null if invalid.
 */
export function normalizePhone(raw: string): string | null {
  // Strip spaces, dashes, dots, parentheses
  const cleaned = raw.replace(/[\s\-.()+]/g, "");
  if (!cleaned) return null;

  let digits = cleaned;

  // Remove country code prefix
  if (digits.startsWith("91") && digits.length === 12) {
    digits = digits.slice(2);
  } else if (digits.startsWith("0") && digits.length === 11) {
    digits = digits.slice(1);
  }

  // Must be exactly 10 digits starting with 6-9
  if (!/^[6-9]\d{9}$/.test(digits)) {
    return null;
  }

  return digits;
}

/**
 * Validate a phone number string. Returns error message or null if valid.
 * Empty/null phone is allowed (phone is optional).
 */
export function validatePhone(phone: string | null | undefined): string | null {
  if (!phone || !phone.trim()) return null;
  const normalized = normalizePhone(phone);
  if (!normalized) {
    return "Enter a valid 10-digit mobile number";
  }
  return null;
}
