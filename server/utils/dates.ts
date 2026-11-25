// MemberBook's customers are in India, so "today" and "this month" must follow
// IST (UTC+5:30), not the Worker's UTC clock. Otherwise, between midnight and
// 5:30 AM IST, yesterday's expiries still look active and the 1st of the month
// still reports the previous month.
const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

/** IST calendar date (YYYY-MM-DD), shifted by `offsetDays`. */
export function dateIST(offsetDays = 0): string {
  const d = new Date(Date.now() + IST_OFFSET_MS);
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export function todayIST(): string {
  return dateIST(0);
}

/** First day of the current IST month (YYYY-MM-01). */
export function monthStartIST(): string {
  return `${todayIST().slice(0, 7)}-01`;
}

/** Add days to a YYYY-MM-DD date string. */
export function addDaysToDate(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const result = new Date(Date.UTC(y!, m! - 1, d! + days));
  return result.toISOString().slice(0, 10);
}

/** A birthday from a form or import: YYYY-MM-DD (or DD-MM-YYYY / DD/MM/YYYY), else null. */
export function parseBirthDate(v: unknown): string | null {
  const s = typeof v === "string" ? v.trim() : "";
  if (!s) return null;
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  let y: number, mo: number, d: number;
  if (m) [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  else if ((m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/))) [d, mo, y] = [Number(m[1]), Number(m[2]), Number(m[3])];
  else return null;
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || y < 1900 || y > 2100) return null;
  return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
