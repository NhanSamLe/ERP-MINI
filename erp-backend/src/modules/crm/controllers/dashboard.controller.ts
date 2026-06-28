import { Request, Response } from "express";
import { crmDashboardService } from "../services/crmDashboard.service";

export async function getSalesDashboard(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const data = await crmDashboardService.getCrmDashboardData(user, req.query);
    return res.json({ success: true, data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Server error";
    console.error("CRM Dashboard Error:", err);
    return res.status(500).json({ success: false, message: msg });
  }
}