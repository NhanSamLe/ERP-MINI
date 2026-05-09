import { Request, Response } from "express";
import * as leadSourceService from "../services/leadSource.service";

export const getAll = async (req: Request, res: Response) => {
  try {
    const sources = await leadSourceService.getAllLeadSources();
    res.json({ message: "Lấy danh sách Nguồn khách hàng thành công", data: sources });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const source = await leadSourceService.createLeadSource(req.body);
    res.status(201).json({ message: "Tạo Nguồn khách hàng thành công", data: source });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const source = await leadSourceService.updateLeadSource(id, req.body);
    res.json({ message: "Cập nhật Nguồn khách hàng thành công", data: source });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await leadSourceService.deleteLeadSource(id);
    res.json({ message: "Xóa Nguồn khách hàng thành công", data: null });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};
