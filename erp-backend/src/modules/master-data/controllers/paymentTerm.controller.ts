import { Request, Response } from "express";
import * as svc from "../services/paymentTerm.service";

function getCompanyId(req: Request): number | undefined {
  return (req as any).user?.company_id ?? undefined;
}

export const getAllPaymentTerms = async (req: Request, res: Response) => {
  try {
    const data = await svc.getAllPaymentTerms(getCompanyId(req));
    res.status(200).json({ message: "Lấy danh sách điều khoản thanh toán thành công.", data });
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Lỗi hệ thống" });
  }
};

export const getActivePaymentTerms = async (req: Request, res: Response) => {
  try {
    const data = await svc.getActivePaymentTerms(getCompanyId(req));
    res.status(200).json({ message: "Lấy điều khoản thanh toán đang hoạt động thành công.", data });
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Lỗi hệ thống" });
  }
};

export const getPaymentTermById = async (req: Request, res: Response) => {
  try {
    const data = await svc.getPaymentTermById(Number(req.params.id));
    res.status(200).json(data);
  } catch (err: any) {
    res.status(404).json({ message: err.message });
  }
};

export const createPaymentTerm = async (req: Request, res: Response) => {
  try {
    const dto: svc.CreatePaymentTermDto = { ...req.body, company_id: getCompanyId(req) ?? null };
    const created = await svc.createPaymentTerm(dto);
    res.status(201).json({ message: "Tạo điều khoản thanh toán thành công.", data: created });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const updatePaymentTerm = async (req: Request, res: Response) => {
  try {
    const updated = await svc.updatePaymentTerm(Number(req.params.id), req.body, getCompanyId(req));
    res.status(200).json({ message: "Cập nhật điều khoản thanh toán thành công.", data: updated });
  } catch (err: any) {
    const status = err.message.includes("không tồn tại") ? 404 : 400;
    res.status(status).json({ message: err.message });
  }
};

export const deletePaymentTerm = async (req: Request, res: Response) => {
  try {
    await svc.deletePaymentTerm(Number(req.params.id), getCompanyId(req));
    res.status(200).json({ message: "Xóa điều khoản thanh toán thành công." });
  } catch (err: any) {
    const status = err.message.includes("không tồn tại") ? 404 : 400;
    res.status(status).json({ message: err.message });
  }
};
