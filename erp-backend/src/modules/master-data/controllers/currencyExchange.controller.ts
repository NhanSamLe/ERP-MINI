import { Request, Response } from "express";
import * as currencyService from "../services/currencyExchange.service";

/**
 * 📘 Lấy danh sách tiền tệ trong DB
 */
export const getCurrencies = async (req: Request, res: Response) => {
  try {
    const data = await currencyService.getCurrencies();
    return res.status(200).json(data);
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};

/**
 * 🌍 Lấy danh sách mã tiền thật (API ngoài)
 */
export const getRealCurrencies = async (req: Request, res: Response) => {
  try {
    const data = await currencyService.getAllRealCurrencies();
    return res.status(200).json(data);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

export const addCurrency = async (req: Request, res: Response) => {
  try {
    const {code} = req.body;
    const currency = await currencyService.addCurrency(code);
    return res.status(201).json({
      message: "Currency added successfully",
      currency,
    });
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};

/**
 * 🔁 Cập nhật tỷ giá (cron hoặc thủ công)
 */
export const updateExchangeRates = async (req: Request, res: Response) => {
  try {
    await currencyService.updateDailyRates();
    return res.status(200).json({ message: "Exchange rates updated successfully" });
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
};

/**
 * 📊 Lấy danh sách tỷ giá 
 */
export const getExchangeRates = async (req: Request, res: Response) => {
  try {
    // Nếu không có query date => để undefined (hàm service sẽ tự lấy hôm nay)
    const date = req.query.date ? String(req.query.date) : undefined;

    const result = await currencyService.getExchangeRates(date);

    return res.status(200).json(result);
  } catch (err: any) {
    console.error("❌ Lỗi khi lấy tỷ giá:", err.message);
    return res.status(400).json({ message: err.message });
  }
};
