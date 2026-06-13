import { Request, Response } from "express";
import * as taxService from "../services/tax.service";
import { getCompanyIdFromUserBranch } from "../../finance/services/companyScope.service";

async function getCompanyId(req: Request): Promise<number | undefined> {
  const user = (req as any).user;
  if (!user?.company_id && !user?.branch_id) return undefined;
  return getCompanyIdFromUserBranch(user);
}

export const searchTaxRates = async (req: Request, res: Response) => {
  try {
    const { search, status } = req.query;
    const data = await taxService.searchTaxRates(search as string, status as string, await getCompanyId(req));
    res.status(200).json({ message: data.length ? "Lấy danh sách thuế thành công" : "Chưa có dữ liệu thuế", data });
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Lỗi hệ thống" });
  }
};

export const getAllTaxRates = async (req: Request, res: Response) => {
  try {
    const data = await taxService.getAllTaxRates(await getCompanyId(req));
    res.status(200).json({ message: data.length ? "Lấy danh sách thuế thành công" : "Chưa có dữ liệu thuế", data });
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Lỗi hệ thống" });
  }
};

export const getActiveTaxRates = async (req: Request, res: Response) => {
  try {
    const data = await taxService.getActiveTaxRates(await getCompanyId(req));
    res.status(200).json({ message: data.length ? "Lấy thuế đang hoạt động thành công" : "Chưa có thuế đang hoạt động", data });
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
    const dto: taxService.CreateTaxRateDto = { ...req.body, company_id: await getCompanyId(req) ?? null };
    const created = await taxService.createTaxRate(dto);
    res.status(201).json({ message: "Thêm thuế mới thành công", data: created });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateTaxRate = async (req: Request, res: Response) => {
  try {
    const dto: taxService.UpdateTaxRateDto = req.body;
    const updated = await taxService.updateTaxRate(Number(req.params.id), dto, await getCompanyId(req));
    res.status(200).json({ message: "Cập nhật thông tin thuế thành công", data: updated });
  } catch (error: any) {
    const status = error.message.includes("không tồn tại") ? 404 : 400;
    res.status(status).json({ message: error.message });
  }
};

export const deleteTaxRate = async (req: Request, res: Response) => {
  try {
    await taxService.deleteTaxRate(Number(req.params.id), await getCompanyId(req));
    res.status(200).json({ message: "Xóa thuế thành công" });
  } catch (error: any) {
    const status = error.message.includes("không tồn tại") ? 404 : 400;
    res.status(status).json({ message: error.message });
  }
};

export const findTaxRatesByType = async (req: Request, res: Response) => {
  try {
    const { type } = req.query;
    const data = await taxService.findTaxRatesByType(type as string, await getCompanyId(req));
    res.status(200).json({ message: "Tìm kiếm theo loại thuế thành công", data });
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Lỗi hệ thống" });
  }
};

export const findTaxRatesByAppliesTo = async (req: Request, res: Response) => {
  try {
    const { applies_to } = req.query;
    const data = await taxService.findTaxRatesByAppliesTo(applies_to as string, await getCompanyId(req));
    res.status(200).json({ message: "Lọc dữ liệu thành công", data });
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Lỗi hệ thống" });
  }
};
