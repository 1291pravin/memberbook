export function useFormatCurrency() {
  function formatCurrency(paise: number): string {
    const rupees = paise / 100;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(rupees);
  }

  function parseCurrencyToInt(rupees: number): number {
    return Math.round(rupees * 100);
  }

  return { formatCurrency, parseCurrencyToInt };
}
