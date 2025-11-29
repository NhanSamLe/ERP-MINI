import { Request, Response } from "express";
import * as service from "../services/attendance.service";
import * as attendanceService from "../services/attendance.service";

export const getAll = async (req: Request, res: Response) => {
  try {
    // 🚫 TẠM THỜI KHÔNG DÙNG req.query LÀM where, cho đỡ lỗi
    // const filter = { ...req.query };

    const filter: any = {}; // lấy hết, không filter gì cả

    const rows = await attendanceService.getAll(filter);
    return res.json(rows);
  } catch (err: any) {
    console.error("getAll attendance error:", err);
    // Đổi thành 500 để biết là lỗi server, không phải do client gửi sai
    return res.status(500).json({ message: err.message || "Internal server error" });
  }
};

export async function getByEmployee(req: Request, res: Response) {
  try {
    const data = await service.getByEmployee(Number(req.params.employeeId));
    res.json(data);
  } catch (e: unknown) {
    const err = e as Error;
    res.status(400).json({ error: err.message });
  }
}

export async function create(req: Request, res: Response) {
  try {
    const data = await service.create(req.body);
    res.json(data);
  } catch (e: unknown) {
    const err = e as Error;
    res.status(400).json({ error: err.message });
  }
}

export async function update(req: Request, res: Response) {
  try {
    const data = await service.update(Number(req.params.id), req.body);
    res.json(data);
  } catch (e: unknown) {
    const err = e as Error;
    res.status(400).json({ error: err.message });
  }
}

export async function remove(req: Request, res: Response) {
  try {
    await service.remove(Number(req.params.id));
    res.json({ message: "Deleted" });
  } catch (e: unknown) {
    const err = e as Error;
    res.status(400).json({ error: err.message });
  }
}
