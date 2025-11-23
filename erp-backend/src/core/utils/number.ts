import * as model from "../../models/index"
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

export const convertCurrency = async (
  from: string,
  to: string,
  amount: number,
  date?: string
): Promise<number> => {
  if (from === to) return amount;

  const baseCode = "VND";
  const targetDate = date ?? new Date().toISOString().slice(0, 10);

  // 🔹 Nếu from = base → tra trực tiếp (base → to)
  if (from === baseCode) {
    const rate = await model.ExchangeRate.findOne({
      where: {
        valid_date: targetDate,
      },
      include: [
        { association: "baseCurrency", where: { code: baseCode } },
        { association: "quoteCurrency", where: { code: to } },
      ],
    });

    if (!rate) throw new Error(`No exchange rate found for ${to} on ${targetDate}`);
    return amount * Number(rate.get("rate"));
  }

  // 🔹 Nếu to = base → chia ngược lại (to ← base)
  if (to === baseCode) {
    const rate = await model.ExchangeRate.findOne({
      where: {
        valid_date: targetDate,
      },
      include: [
        { association: "baseCurrency", where: { code: baseCode } },
        { association: "quoteCurrency", where: { code: from } },
      ],
    });

    if (!rate) throw new Error(`No exchange rate found for ${from} on ${targetDate}`);
    return amount / Number(rate.get("rate"));
  }

  // 🔹 Nếu cả from & to đều khác base → chuyển 2 bước (qua VND)
  const amountInBase = await convertCurrency(from, baseCode, amount, targetDate);
  return convertCurrency(baseCode, to, amountInBase, targetDate);
};