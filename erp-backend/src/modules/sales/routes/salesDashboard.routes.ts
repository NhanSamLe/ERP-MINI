import { Router } from "express";
import { salesDashboardController } from "../controllers/salesDashboard.controller";
import { authMiddleware } from "../../../core/middleware/auth";

const router = Router();

// Lấy dữ liệu Sales Dashboard
router.get("/", authMiddleware([]), salesDashboardController.getDashboardData);

// Xuất báo cáo Excel Sales Dashboard
router.get("/export", authMiddleware([]), salesDashboardController.exportDashboardExcel);

export default router;
