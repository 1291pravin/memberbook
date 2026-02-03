export function useFormatDate() {
  const ordinalSuffix = (day: number): string => {
    if (day >= 11 && day <= 13) return "th";
    switch (day % 10) {
      case 1: return "st";
      case 2: return "nd";
      case 3: return "rd";
      default: return "th";
    }
  };

  /**
   * Format a date string as "3rd Feb 2026"
   * Accepts ISO date strings (YYYY-MM-DD) or full ISO datetime strings.
   */
  function formatDate(dateStr: string): string {
    // For date-only strings (YYYY-MM-DD), append time to avoid timezone shifts
    const d = dateStr.length === 10 ? new Date(dateStr + "T00:00:00") : new Date(dateStr);
    const day = d.getDate();
    const month = d.toLocaleDateString("en-US", { month: "short" });
    const year = d.getFullYear();
    return `${day}${ordinalSuffix(day)} ${month} ${year}`;
  }

  /**
   * Format a datetime string as "3rd Feb 2026, 2:30 PM"
   * Use for timestamps that include time (invitations, events).
   */
  function formatDateTime(dateStr: string): string {
    const d = new Date(dateStr);
    const day = d.getDate();
    const month = d.toLocaleDateString("en-US", { month: "short" });
    const year = d.getFullYear();
    const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    return `${day}${ordinalSuffix(day)} ${month} ${year}, ${time}`;
  }

  return { formatDate, formatDateTime };
}
