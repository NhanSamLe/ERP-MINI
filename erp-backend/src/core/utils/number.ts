// Làm tròn số
export const roundNumber = (value: number, decimals = 2): number => {
  return Number(value.toFixed(decimals));
};

// fomat tiền
export const formatCurrency = (amount: number, currency = "VND", locale = "vi-VN"): string => {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount);
};

// tinh thue VAT
export const calculateTax = (amount: number, rate: number) => {
  const tax = amount * rate;
  return { tax, total: amount + tax };
};