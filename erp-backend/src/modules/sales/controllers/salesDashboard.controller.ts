import { Request, Response } from "express";
import { salesDashboardService } from "../services/salesDashboard.service";

export const salesDashboardController = {
  async getDashboardData(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const data = await salesDashboardService.getSalesDashboardData(user, req.query);
      return res.json({ success: true, data });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Server error";
      console.error("Sales Dashboard Error:", err);
      return res.status(500).json({ success: false, message: msg });
    }
  },

  async exportDashboardExcel(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const buffer = await salesDashboardService.exportSalesDashboardExcel(user, req.query);
      
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", "attachment; filename=sales-dashboard-report.xlsx");
      return res.send(buffer);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Server error";
      console.error("Export Excel Error:", err);
      return res.status(500).json({ success: false, message: msg });
    }
  }
};
