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
