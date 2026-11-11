// Cells starting with these characters are run as formulas by Excel, Google
// Sheets and LibreOffice (CSV/formula injection). Plain numbers are left alone.
const FORMULA_PREFIX = /^[=+\-@\t\r]/;
const PLAIN_NUMBER = /^[+-]?\d+(\.\d+)?$/;

export function escapeCsvField(value: unknown): string {
  let str = value == null ? "" : String(value);
  if (FORMULA_PREFIX.test(str) && !PLAIN_NUMBER.test(str)) {
    str = `'${str}`;
  }
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function generateCsv(headers: string[], rows: Record<string, unknown>[]): string {
  const lines = [headers.map(escapeCsvField).join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escapeCsvField(row[h])).join(","));
  }
  return lines.join("\r\n") + "\r\n";
}
