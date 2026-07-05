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
  const num = Math.round(Number(value));
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

  const maxDecimals = currency.toUpperCase() === "VND" ? 0 : 2;

  // Format số theo locale VN, append currency code (không dùng symbol để nhất quán đa tiền tệ)
  return `${new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
  }).format(Math.round(num))} ${currency}`;
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
 * Format một giá trị số để HIỂN THỊ TRONG Ô NHẬP LIỆU theo kiểu VN: phân tách
 * nghìn bằng dấu chấm (1.000.000), giữ nguyên phần thập phân người dùng đang gõ.
 * Khác formatNumber ở chỗ giữ lại dấu thập phân dở dang (vd "1.000,") khi đang gõ.
 */
export function formatNumberInput(raw: string | number | null | undefined): string {
  if (raw == null || raw === "") return "";
  let s = String(raw).replace(/\./g, "").replace(/[^\d,]/g, "");
  // Cho phép tối đa 1 dấu phẩy thập phân
  const firstComma = s.indexOf(",");
  if (firstComma !== -1) {
    s = s.slice(0, firstComma + 1) + s.slice(firstComma + 1).replace(/,/g, "");
  }
  const [intPart, decPart] = s.split(",");
  const intFormatted = intPart
    ? Number(intPart).toLocaleString("vi-VN")
    : "";
  return decPart !== undefined ? `${intFormatted},${decPart}` : intFormatted;
}

/**
 * Parse chuỗi từ ô nhập (đã format kiểu VN "1.000,5") về number thuần (1000.5).
 * Trả về null nếu rỗng/không hợp lệ.
 */
export function parseNumberInput(display: string): number | null {
  if (display == null) return null;
  const normalized = String(display).replace(/\./g, "").replace(/,/g, ".").replace(/[^\d.-]/g, "");
  if (normalized === "" || normalized === "-" || normalized === ".") return null;
  const num = Number(normalized);
  return Number.isNaN(num) ? null : num;
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
