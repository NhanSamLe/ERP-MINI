import { Request, Response } from "express";
import * as payrollConfigService from "../services/payrollConfig.service";
import { Role } from "../../../core/types/enum";

export async function getConfigs(req: Request, res: Response) {
  try {
    const data = await payrollConfigService.getPayrollConfigs();
    return res.json(data);
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
}

export async function updateConfigs(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    if (user.role !== "HR" && user.role !== "CHACC" && user.role !== "ADMIN") {
      return res.status(403).json({ message: "Bạn không có quyền cập nhật cấu hình lương." });
    }

    const data = await payrollConfigService.updatePayrollConfigs(req.body);
    return res.json({ success: true, message: "Cập nhật cấu hình lương thành công.", data });
  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
}
