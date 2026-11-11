// `new Date().toISOString()` is UTC, which in India is the previous day until
// 5:30 AM. These helpers use the browser's local calendar date instead.

/** YYYY-MM-DD for a Date, in the browser's local time zone. */
export function toLocalDateString(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function todayLocal(): string {
  return toLocalDateString(new Date());
}

/** Add days to a YYYY-MM-DD string (pure calendar math, no time zone). */
export function addDaysToDateString(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, d! + days)).toISOString().slice(0, 10);
}
