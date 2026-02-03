export function calculateEndDate(startDate: string, durationType: string, durationValue: number): string {
  const date = new Date(startDate + "T00:00:00");

  switch (durationType) {
    case "daily":
      date.setDate(date.getDate() + durationValue);
      break;
    case "weekly":
      date.setDate(date.getDate() + durationValue * 7);
      break;
    case "monthly":
      date.setMonth(date.getMonth() + durationValue);
      break;
    case "yearly":
      date.setFullYear(date.getFullYear() + durationValue);
      break;
  }

  return date.toISOString().split("T")[0];
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
