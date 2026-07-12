import { Router } from "express";
import { ReportController } from "./controllers/report.controller";
import { inventoryReportController } from "./controllers/inventoryReport.controller";
import { purchaseReportController } from "./controllers/purchaseReport.controller";
import { ocrReportController } from "./controllers/ocrReport.controller";
import { authMiddleware } from "../../core/middleware/auth";
import { Role } from "../../core/types/enum";

const router = Router();

const allRoles = authMiddleware([Role.ADMIN, Role.WHMANAGER, Role.WHSTAFF]);
const purchaseDashboardRoles = authMiddleware([
  Role.ADMIN,
  Role.PURCHASE,
  Role.PURCHASEMANAGER,
  Role.ACCOUNT,
  Role.CHACC,
  Role.CEO,
]);
const financeRoles = authMiddleware([
  Role.ACCOUNT,
  Role.CHACC,
  Role.ADMIN,
  Role.CEO,
]);
const summaryRoles = authMiddleware([Role.CEO, Role.BRANCH_MANAGER]);

router.get("/sales", summaryRoles, ReportController.getSalesSummary);
router.get("/purchase", summaryRoles, ReportController.getPurchaseSummary);
router.get("/branch-analysis", authMiddleware(["CEO", "ADMIN"]), ReportController.getBranchAnalysis);

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
router.get(
  "/purchase/dashboard-stats",
  purchaseDashboardRoles,
  purchaseReportController.dashboardStats,
);

// OCR & AP Invoice reports
router.get("/ocr/processing", financeRoles, ocrReportController.ocrProcessing);
router.get(
  "/ocr/three-way-matching",
  financeRoles,
  ocrReportController.threeWayMatching,
);
router.get(
  "/ocr/duplicate-detection",
  financeRoles,
  ocrReportController.duplicateDetection,
);
router.get(
  "/ocr/confidence-distribution",
  financeRoles,
  ocrReportController.confidenceDistribution,
);

export const reportRoutes = router;
