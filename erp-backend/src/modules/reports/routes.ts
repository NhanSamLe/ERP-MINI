import { Router } from "express";
import { ReportController } from "./controllers/report.controller";
import { inventoryReportController } from "./controllers/inventoryReport.controller";
import { authMiddleware } from "../../core/middleware/auth";
import { Role } from "../../core/types/enum";

const router = Router();

const allRoles = authMiddleware([Role.ADMIN, Role.WHMANAGER, Role.WHSTAFF]);

router.get("/sales", ReportController.getSalesSummary);
router.get("/purchase", ReportController.getPurchaseSummary);

// Inventory reports
router.get(
  "/inventory/stock-summary",
  allRoles,
  inventoryReportController.stockSummary,
);
router.get(
  "/inventory/stock-valuation",
  allRoles,
  inventoryReportController.stockValuation,
);
router.get(
  "/inventory/stock-movement",
  allRoles,
  inventoryReportController.stockMovement,
);
router.get(
  "/inventory/low-stock",
  allRoles,
  inventoryReportController.lowStock,
);
router.get(
  "/inventory/expiring-lots",
  allRoles,
  inventoryReportController.expiringLots,
);
router.get(
  "/inventory/dashboard-stats",
  allRoles,
  inventoryReportController.dashboardStats,
);

export const reportRoutes = router;
