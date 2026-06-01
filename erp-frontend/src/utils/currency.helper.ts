export function convertToBase(rate: number | string, base: string): string {
  // Parse to number in case API returns string
  const numericRate = typeof rate === "string" ? parseFloat(rate) : rate;

  // Handle invalid rate
  if (isNaN(numericRate) || numericRate <= 0) return "-";

  let converted = 0;

  // Example rule: if base is VND, convert from quote → base
  // meaning 1 quoteCurrency = (1 / rate) baseCurrency
  if (base.toUpperCase() === "VND") {
    converted = 1 / numericRate;
  } else {
    // you can extend here for other base currencies if needed
    converted = numericRate;
  }

  // Format with commas and 2 decimal places
  return converted.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function formatVND(value: number | null | undefined): string {
  if (value == null || value === 0) return "0 ₫";
  const num = Number(value);
  return num.toLocaleString("vi-VN") + " ₫";
}

export function formatMoney(
  value?: number | string | null,
  currency = "VND",
  locale = "vi-VN",
): string {
  if (value === null || value === undefined || value === "") return "—";

  const num =
    typeof value === "string" ? Number(value.replace(/[^\d.-]/g, "")) : value;

  if (Number.isNaN(num)) return "—";

  // Format số theo locale VN, append currency code (không dùng symbol để nhất quán đa tiền tệ)
  return `${new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num)} ${currency}`;
}

export function formatNumber(
  value: number | string,
  fractionDigits = 2,
): string {
  const num = Number(value);
  if (isNaN(num)) return "0";

  return new Intl.NumberFormat("vi-VN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: fractionDigits,
  }).format(num);
}

export function formatQuantity(
  value: number | string | null | undefined,
): string {
  if (value == null || value === "") return "0";
  const num = Number(value);
  if (isNaN(num)) return "0";

  // Format quantity as integer without decimal places
  return new Intl.NumberFormat("vi-VN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatPercent(
  value: number | string,
  fractionDigits = 2,
): string {
  const num = Number(value);
  if (isNaN(num)) return "0%";

  return `${formatNumber(num, fractionDigits)}%`;
}

/**
 * Format currency with proper symbol
 * @param value - Amount to format
 * @param currencySymbol - Currency symbol (e.g., "$", "₫", "€")
 * @returns Formatted string with symbol
 */
export function formatCurrency(
  value: number | null | undefined,
  currencySymbol: string = "₫",
): string {
  if (value == null) return `0 ${currencySymbol}`;
  const num = Number(value);
  if (isNaN(num)) return `0 ${currencySymbol}`;

  return `${num.toLocaleString("vi-VN")} ${currencySymbol}`;
}
