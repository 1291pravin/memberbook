import type { ChartOptions } from "chart.js";

export function useCharts() {
  const { formatCurrency } = useFormatCurrency();

  // Quiet Jamun Plum palette tuned for the dark operator dashboard.
  const colors = {
    blue: "oklch(72% 0.095 245)",
    green: "oklch(72% 0.11 150)",
    yellow: "oklch(78% 0.12 82)",
    purple: "oklch(68% 0.095 315)",
    red: "oklch(72% 0.115 24)",
    amber: "oklch(75% 0.11 86)",
    orange: "oklch(70% 0.11 56)",
    pink: "oklch(70% 0.10 350)",
    indigo: "oklch(68% 0.095 315)",
    cyan: "oklch(74% 0.09 210)",
    gray: "oklch(66% 0.022 315)",
    blueAlpha: "oklch(72% 0.095 245 / 0.14)",
    greenAlpha: "oklch(72% 0.11 150 / 0.14)",
    purpleAlpha: "oklch(68% 0.095 315 / 0.16)",
    amberAlpha: "oklch(75% 0.11 86 / 0.16)",
    indigoAlpha: "oklch(68% 0.095 315 / 0.16)",
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
          font: { family: "-apple-system, BlinkMacSystemFont, Segoe UI, system-ui", size: 12 },
          color: "oklch(75% 0.024 315)",
          padding: 12,
        },
      },
      tooltip: {
        backgroundColor: "oklch(18% 0.018 315)",
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
