export function escapeCsvField(value: unknown): string {
  const str = value == null ? "" : String(value);
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
