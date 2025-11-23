import * as model from "../../../models/index";
import axios from "axios";
import { CURRENCY_INFO } from "./currency.constants";
import { Op, Sequelize } from "sequelize";

export interface CurrencyAttrs {
  id: number;
  code: string;
  name?: string;
  symbol?: string;
}


export const getAllRealCurrencies = async () => {
  const { data } = await axios.get("https://open.er-api.com/v6/latest/VND");
  return Object.keys(data.rates).map((code) => ({
    code,
    name: CURRENCY_INFO[code]?.name ?? code,
    symbol: CURRENCY_INFO[code]?.symbol ?? code,
  }));
};

export const addCurrency = async (code: string) => {
  const exist = await model.Currency.findOne({ where: { code } });
  if (exist) throw new Error("Currency already exists");

  const info = CURRENCY_INFO[code] ?? { name: code, symbol: code };

  const newCurrency = await model.Currency.create({
    code,
    name: info.name,
    symbol: info.symbol,
  });

  const baseCurrency = await model.Currency.findOne({ where: { code: "VND" } });
  if (!baseCurrency) throw new Error("Base currency VND not found");

  const { data } = await axios.get("https://open.er-api.com/v6/latest/VND");
  const rates = data.rates;
  const today = new Date().toISOString().slice(0, 10);

  if (!rates[code]) throw new Error(`No rate found for ${code}`);

  // VND -> newCurrency
  await model.ExchangeRate.create({
    base_currency_id: baseCurrency.id,
    quote_currency_id: newCurrency.id,
    rate: rates[code],
    valid_date: today,
  });

  console.log(`✅ Added ${code} (${info.name}) successfully with exchange rates`);
  return newCurrency;
};


export const updateDailyRates = async () => {
  const { data } = await axios.get("https://open.er-api.com/v6/latest/VND");
  const rates = data.rates;

  const baseCurrency = await model.Currency.findOne({ where: { code: "VND" } });
  if (!baseCurrency) throw new Error("Base currency VND not found");

  const currencies = await model.Currency.findAll();
  const today = new Date().toISOString().slice(0, 10);

  for (const c of currencies) {
    if (c.code === "VND" || !rates[c.code]) continue;

    const exist = await model.ExchangeRate.findOne({
      where: {
        base_currency_id: baseCurrency.id,
        quote_currency_id: c.id,
        valid_date: today,
      },
    });

    if (exist) {
      await exist.update({ rate: rates[c.code] });
    } else {
      await model.ExchangeRate.create({
        base_currency_id: baseCurrency.id,
        quote_currency_id: c.id,
        rate: rates[c.code],
        valid_date: today,
      });
    }
  }

  console.log("✅ Exchange rates updated successfully (base: VND)");
  return true;
};


// export const getLatestRates = async () => {
//   const baseCurrency = await model.Currency.findOne({ where: { code: "VND" } });
//   if (!baseCurrency) throw new Error("Base currency VND not found");

//   // Hôm nay
//   const today = new Date().toISOString().slice(0, 10);

//   // Lấy tỷ giá theo ngày hôm nay, mỗi tiền chỉ 1 dòng
//   const rates = await model.ExchangeRate.findAll({
//     where: {
//       base_currency_id: baseCurrency.id,
//       valid_date: today,
//     },
//     attributes: [
//       "id",
//       "rate",
//       "valid_date",
//       "base_currency_id",
//       "quote_currency_id",
//     ],
//     group: ["quote_currency_id", "base_currency_id", "valid_date", "id"],
//     include: [
//       { association: "baseCurrency", attributes: ["code"] },
//       { association: "quoteCurrency", attributes: ["code"] },
//     ],
//     order: [["quote_currency_id", "ASC"]],
//   });

//   if (!rates.length) return { message: `No exchange rates found for ${today}` };

//   return { date: today, count: rates.length, rates };
// };

// /**
//  * 🔹 Lấy tỷ giá theo ngày cụ thể (VD: 2025-11-10)
//  */
// export const getRatesByDate = async (date: string) => {
//   const baseCurrency = await model.Currency.findOne({ where: { code: "VND" } });
//   if (!baseCurrency) throw new Error("Base currency VND not found");

//   const rates = await model.ExchangeRate.findAll({
//     where: {
//       base_currency_id: baseCurrency.id,
//       valid_date: date,
//     },
//     attributes: [
//       "id",
//       "rate",
//       "valid_date",
//       "base_currency_id",
//       "quote_currency_id",
//     ],
//     group: ["quote_currency_id", "base_currency_id", "valid_date", "id"],
//     include: [
//       { association: "baseCurrency", attributes: ["code"] },
//       { association: "quoteCurrency", attributes: ["code"] },
//     ],
//     order: [["quote_currency_id", "ASC"]],
//   });

//   if (!rates.length) return { message: `No exchange rates found for ${date}` };

//   return { date, count: rates.length, rates };
// };

export const getExchangeRates = async (date?: string) => {
  const baseCurrency = await model.Currency.findOne({ where: { code: "VND" } });
  if (!baseCurrency) throw new Error("Base currency VND not found");

  // Nếu không truyền ngày → lấy hôm nay
  const targetDate = date ?? new Date().toISOString().slice(0, 10);

  let rates = await model.ExchangeRate.findAll({
    where: {
      base_currency_id: baseCurrency.id,
      valid_date: targetDate,
    },
    include: [
      { association: "baseCurrency", attributes: ["code"] },
      { association: "quoteCurrency", attributes: ["code"] },
    ],
    order: [["quote_currency_id", "ASC"]],
  });

  // Nếu không có tỷ giá đúng ngày → fallback ngày gần nhất trước đó
  if (!rates.length) {
    const latestBefore = await model.ExchangeRate.findOne({
      where: {
        base_currency_id: baseCurrency.id,
        valid_date: { [Op.lt]: targetDate },
      },
      order: [["valid_date", "DESC"]],
      attributes: ["valid_date"],
    });

    if (latestBefore) {
      rates = await model.ExchangeRate.findAll({
        where: {
          base_currency_id: baseCurrency.id,
          valid_date: latestBefore.valid_date,
        },
        include: [
          { association: "baseCurrency", attributes: ["code"] },
          { association: "quoteCurrency", attributes: ["code"] },
        ],
        order: [["quote_currency_id", "ASC"]],
      });

      return {
        message: `No rates found for ${targetDate}, showing last available on ${latestBefore.valid_date}`,
        date: latestBefore.valid_date,
        count: rates.length,
        rates,
      };
    }

    return { message: `No exchange rates found before ${targetDate}` };
  }

  return { date: targetDate, count: rates.length, rates };
};

export const getCurrencies = async () => {
  const currencies = await model.Currency.findAll({
    attributes: ["id", "code", "name", "symbol"],
    order: [["code", "ASC"]],
  });

  if (!currencies.length) {
    return { message: "No currencies found" };
  }

  return {
    count: currencies.length,
    currencies,
  };
};
