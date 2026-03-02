/**
 * Indian phone number normalization utilities
 * Ported from app/composables/useWhatsApp.ts
 */

/**
 * Normalize an Indian phone number to +91XXXXXXXXXX format
 * @param {string} phone - Raw phone string
 * @returns {string} Normalized phone in +91 format, or empty string if invalid
 */
export function normalizeIndianPhone(phone) {
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, '');

  if (cleaned.length === 10) {
    cleaned = '91' + cleaned;
  } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
    // Already has country code
  } else if (cleaned.length > 10 && !cleaned.startsWith('91')) {
    cleaned = '91' + cleaned.slice(-10);
  }

  if (cleaned.length !== 12 || !cleaned.startsWith('91')) return '';
  return '+' + cleaned;
}

/**
 * Build a WhatsApp click-to-chat link
 * @param {string} phone - Raw phone string
 * @param {string} message - Pre-filled message
 * @returns {string} wa.me URL
 */
export function buildWhatsAppLink(phone, message) {
  const normalized = normalizeIndianPhone(phone);
  if (!normalized) return '';
  const number = normalized.replace('+', '');
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${number}?text=${encoded}`;
}
