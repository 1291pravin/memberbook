import type { ChartOptions } from "chart.js";

export function useCharts() {
  const { formatCurrency } = useFormatCurrency();

  // Circle brand palette for the light merchant app (lagoon teal first, coral second).
  const colors = {
    blue: "#0F766E",
    green: "#2F9E6E",
    yellow: "#E0A800",
    purple: "#6B3E75",
    red: "#D9534F",
    amber: "#F4A261",
    orange: "#FF7A59",
    pink: "#E26D8F",
    indigo: "#1F5FCC",
    cyan: "#1B8C82",
    gray: "#8A969C",
    blueAlpha: "rgba(15, 118, 110, 0.14)",
    greenAlpha: "rgba(47, 158, 110, 0.14)",
    purpleAlpha: "rgba(107, 62, 117, 0.14)",
    amberAlpha: "rgba(244, 162, 97, 0.16)",
    indigoAlpha: "rgba(31, 95, 204, 0.14)",
  };

  // Base chart options
  const baseOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "bottom",
        labels: {
          font: { family: "Plus Jakarta Sans, -apple-system, BlinkMacSystemFont, Segoe UI, system-ui", size: 12 },
          color: "#4B5B63",
          padding: 12,
        },
      },
      tooltip: {
        backgroundColor: "#13232B",
        padding: 12,
        cornerRadius: 8,
        titleFont: { size: 14, weight: "bold" },
        bodyFont: { size: 13 },
      },
    },
  };

  // Format revenue amount for Y-axis
  const formatRevenueLabel = (value: number) => {
    const rupees = value / 100; // Convert paise to rupees
    if (rupees >= 100000) return `₹${(rupees / 100000).toFixed(1)}L`;
    if (rupees >= 1000) return `₹${(rupees / 1000).toFixed(1)}K`;
    return `₹${rupees}`;
  };

  // Format date for X-axis based on period
  const formatDateLabel = (dateStr: string, period: "daily" | "weekly" | "monthly") => {
    const date = new Date(dateStr);
    if (period === "monthly") {
      return date.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
    }
    if (period === "weekly") {
      return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
    }
    return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
  };

  // Format month label from YYYY-MM
  const formatMonthLabel = (monthStr: string) => {
    const parts = monthStr.split("-");
    const date = new Date(Number.parseInt(parts[0] ?? "0"), Number.parseInt(parts[1] ?? "1") - 1);
    return date.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
  };

  return {
    colors,
    baseOptions,
    formatRevenueLabel,
    formatDateLabel,
    formatMonthLabel,
    formatCurrency,
  };
}
