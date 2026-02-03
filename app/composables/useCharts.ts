import type { ChartOptions } from "chart.js";

export function useCharts() {
  const { formatCurrency } = useFormatCurrency();

  // Color palette based on Tailwind CSS
  const colors = {
    blue: "rgb(59, 130, 246)",
    green: "rgb(16, 185, 129)",
    yellow: "rgb(234, 179, 8)",
    purple: "rgb(168, 85, 247)",
    red: "rgb(239, 68, 68)",
    amber: "rgb(245, 158, 11)",
    gray: "rgb(107, 114, 128)",
    blueAlpha: "rgba(59, 130, 246, 0.1)",
    greenAlpha: "rgba(16, 185, 129, 0.1)",
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
          font: { family: "Inter, system-ui", size: 12 },
          color: "#6B7280",
          padding: 12,
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
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
