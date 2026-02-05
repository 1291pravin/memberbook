export function calculateEndDate(startDate: string, durationType: string, durationValue: number): string {
  // Parse as UTC to avoid timezone shifts on Cloudflare Workers
  const [y, m, d] = startDate.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));

  switch (durationType) {
    case "daily":
      date.setUTCDate(date.getUTCDate() + durationValue);
      break;
    case "weekly":
      date.setUTCDate(date.getUTCDate() + durationValue * 7);
      break;
    case "monthly":
      date.setUTCMonth(date.getUTCMonth() + durationValue);
      break;
    case "yearly":
      date.setUTCFullYear(date.getUTCFullYear() + durationValue);
      break;
  }

  const ey = date.getUTCFullYear();
  const em = String(date.getUTCMonth() + 1).padStart(2, "0");
  const ed = String(date.getUTCDate()).padStart(2, "0");
  return `${ey}-${em}-${ed}`;
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
