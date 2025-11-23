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