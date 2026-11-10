function daysInMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

/**
 * The date the next billing cycle starts, `months` after the start date.
 * If that day doesn't exist (Jan 31 + 1 month), the cycle runs to the end of
 * the shorter month and the next one starts on the 1st after it.
 */
function nextCycleStart(year: number, monthIndex: number, day: number, months: number): Date {
  const target = new Date(Date.UTC(year, monthIndex + months, 1));
  const lastDay = daysInMonth(target.getUTCFullYear(), target.getUTCMonth());
  if (day <= lastDay) {
    target.setUTCDate(day);
  } else {
    target.setUTCMonth(target.getUTCMonth() + 1, 1);
  }
  return target;
}

/**
 * Last day (inclusive) of a subscription. The app treats a member as active
 * while endDate >= today, so a 1-month plan from Jan 1 ends Jan 31 and a
 * 1-day plan ends on its start date. The renewal starts the day after.
 */
export function calculateEndDate(startDate: string, durationType: string, durationValue: number): string {
  // Parse as UTC to avoid timezone shifts on Cloudflare Workers
  const [y, m, d] = startDate.split("-").map(Number) as [number, number, number];

  let next: Date;
  switch (durationType) {
    case "daily":
      next = new Date(Date.UTC(y, m - 1, d + durationValue));
      break;
    case "weekly":
      next = new Date(Date.UTC(y, m - 1, d + durationValue * 7));
      break;
    case "monthly":
      next = nextCycleStart(y, m - 1, d, durationValue);
      break;
    case "yearly":
      next = nextCycleStart(y, m - 1, d, durationValue * 12);
      break;
    default:
      throw createError({ statusCode: 400, statusMessage: "Invalid plan duration" });
  }

  next.setUTCDate(next.getUTCDate() - 1);
  return next.toISOString().slice(0, 10);
}

export function formatDuration(durationType: string, durationValue: number): string {
  const labels: Record<string, [string, string]> = {
    daily: ["Day", "Days"],
    weekly: ["Week", "Weeks"],
    monthly: ["Month", "Months"],
    yearly: ["Year", "Years"],
  };

  const [singular, plural] = labels[durationType] ?? ["Unit", "Units"];
  return `${durationValue} ${durationValue === 1 ? singular : plural}`;
}
