import { Request, Response } from "express";
import * as taxService from "../services/tax.service";

export const searchTaxRates = async (req: Request, res: Response) => {
  try {
    const { search, status } = req.query;

    const data = await taxService.searchTaxRates(
      search as string,
      status as string
    );

    if (!data.length) {
      return res.status(200).json({
        message: "Chưa có dữ liệu thuế",
        data: [],
      });
    }

    res.status(200).json({
      message: "Lấy danh sách thuế thành công",
      data,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Lỗi hệ thống" });
  }
};
export const getAllTaxRates = async (req: Request, res: Response) => {
  try {
    const data = await taxService.getAllTaxRates();
    if (!data.length) {
      return res.status(200).json({
        message: "Chưa có dữ liệu thuế",
        data: [],
        });
    }
    res.status(200).json({
      message: "Lấy danh sách thuế thành công",
      data,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Lỗi hệ thống" });
  }
};
export const getActiveTaxRates = async (req: Request, res: Response) => {
  try {
    const data = await taxService.getActiveTaxRates();
    if (!data.length) {
      return res.status(200).json({
        message: "Chưa có thuế đang hoạt động",
        data: [],
      });
    }
    res.status(200).json({
      message: "Lấy thuế đang hoạt động thành công",
      data,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Lỗi hệ thống" });
  }
};

export const getTaxById = async (req: Request, res: Response) => {
  try {
    const data = await taxService.getTaxById(Number(req.params.id));
    res.status(200).json(data);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

export const createTaxRate = async (req: Request, res: Response) => {
  try {
    const dto: taxService.CreateTaxRateDto = req.body;

    const created = await taxService.createTaxRate(dto);

    res.status(201).json({
      message: "Thêm thuế mới thành công",
      data: created,
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateTaxRate = async (req: Request, res: Response) => {
  try {
    const dto: taxService.UpdateTaxRateDto = req.body;

    const updated = await taxService.updateTaxRate(
      Number(req.params.id),
      dto
    );

    res.status(200).json({
      message: "Cập nhật thông tin thuế thành công",
      data: updated,
    });
  } catch (error: any) {
    if (error.message.includes("không tồn tại")) {
      return res.status(404).json({ message: error.message });
    }
    res.status(400).json({ message: error.message });
  }
};

export const deleteTaxRate = async (req: Request, res: Response) => {
  try {
    const deleted = await taxService.deleteTaxRate(Number(req.params.id));

    res.status(200).json({
      message: deleted ? "Xóa thuế thành công" : "Không thể xóa thuế",
    });
  } catch (error: any) {
    if (error.message.includes("không tồn tại")) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: "Không thể xóa. Vui lòng thử lại sau." });
  }
};

export const findTaxRatesByType = async (req: Request, res: Response) => {
  try {
    const { type } = req.query;

    const data = await taxService.findTaxRatesByType(type as string);

    res.status(200).json({
      message: "Tìm kiếm theo loại thuế thành công",
      data,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Lỗi hệ thống" });
  }
};

export const findTaxRatesByAppliesTo = async (req: Request, res: Response) => {
  try {
    const { applies_to } = req.query;

    const data = await taxService.findTaxRatesByAppliesTo(applies_to as string);

    res.status(200).json({
      message: "Lọc dữ liệu thành công",
      data,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Lỗi hệ thống" });
  }
};
