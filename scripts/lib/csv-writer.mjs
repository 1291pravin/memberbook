/**
 * CSV generation utilities
 * Ported from server/utils/csv.ts
 */

/**
 * Escape a value for CSV output
 * @param {unknown} value
 * @returns {string}
 */
export function escapeCsvField(value) {
  const str = value == null ? '' : String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Generate a CSV string from headers and row objects
 * @param {string[]} headers
 * @param {Record<string, unknown>[]} rows
 * @returns {string}
 */
export function generateCsv(headers, rows) {
  const lines = [headers.map(escapeCsvField).join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => escapeCsvField(row[h])).join(','));
  }
  return lines.join('\r\n') + '\r\n';
}

/** CSV headers for lead export */
export const LEAD_CSV_HEADERS = [
  'name',
  'phone',
  'phone_normalized',
  'address',
  'city',
  'category',
  'rating',
  'reviews',
  'scale',
  'website',
  'google_maps_url',
  'whatsapp_link',
];
