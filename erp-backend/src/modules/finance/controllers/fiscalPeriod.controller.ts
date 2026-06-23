import { Request, Response } from "express";
import { FiscalPeriod } from "../models/fiscalPeriod.model";
import { closeBranchPeriod } from "../services/glJournal.service";
import { Role } from "../../../core/types/enum";

export async function listPeriods(req: Request, res: Response) {
  try {
    const data = await FiscalPeriod.findAll({
      order: [["start_date", "ASC"]],
    });
    return res.json(data);
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
}

export async function closePeriod(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (user.role !== "CHACC" && user.role !== "ADMIN") {
      return res.status(403).json({ message: "Chỉ Kế toán trưởng hoặc Admin mới có quyền khóa sổ kỳ kế toán." });
    }

    const id = Number(req.params.id);
    const period = await FiscalPeriod.findByPk(id);
    if (!period) return res.status(404).json({ message: "Không tìm thấy kỳ kế toán." });

    if (period.status === "closed") {
      return res.status(400).json({ message: "Kỳ kế toán này đã được khóa sổ trước đó." });
    }

    await period.update({
      status: "closed",
      closed_by: user.id,
      closed_at: new Date(),
    });

    return res.json({ success: true, message: `Đã khóa sổ kỳ kế toán [${period.name}] thành công.`, data: period });
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
}

export async function openPeriod(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (user.role !== "CHACC" && user.role !== "ADMIN") {
      return res.status(403).json({ message: "Chỉ Kế toán trưởng hoặc Admin mới có quyền mở sổ kỳ kế toán." });
    }

    const id = Number(req.params.id);
    const period = await FiscalPeriod.findByPk(id);
    if (!period) return res.status(404).json({ message: "Không tìm thấy kỳ kế toán." });

    if (period.status === "open") {
      return res.status(400).json({ message: "Kỳ kế toán này hiện đang mở." });
    }

    await period.update({
      status: "open",
      closed_by: null,
      closed_at: null,
    });

    return res.json({ success: true, message: `Đã mở sổ kỳ kế toán [${period.name}] thành công.`, data: period });
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
}

export async function closeBranchPeriodController(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (user.role !== "CHACC" && user.role !== "ADMIN") {
      return res.status(403).json({ message: "Chỉ Kế toán trưởng hoặc Admin mới có quyền chạy bút toán kết chuyển." });
    }

    const { period_id } = req.body;
    const branchId = user.branch_id;

    if (!period_id) {
      return res.status(400).json({ message: "period_id là bắt buộc." });
    }

    const entry = await closeBranchPeriod(Number(period_id), Number(branchId), user.id);
    return res.status(201).json({
      success: true,
      message: "Đã tạo bút toán kết chuyển cuối kỳ thành công.",
      data: entry
    });
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
}
