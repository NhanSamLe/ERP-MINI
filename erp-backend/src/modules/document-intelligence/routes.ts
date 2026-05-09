import { Router } from "express";
import { documentController } from "./controllers/document.controller";
import { anomalyController } from "./controllers/anomaly.controller";
import { authMiddleware } from "../../core/middleware/auth";
import { Role } from "../../core/types/enum";
import { invoiceUploadMiddleware } from "./middleware/invoiceUpload.middleware";
import {
  uploadRateLimit,
  statusCheckRateLimit,
} from "./middleware/documentRateLimit";

const router = Router();
const matchingRouter = Router();

const allRoles = authMiddleware([
  Role.ADMIN,
  Role.WHMANAGER,
  Role.WHSTAFF,
  Role.SALES,
  Role.SALESMANAGER,
  Role.PURCHASE,
  Role.PURCHASEMANAGER,
  Role.ACCOUNT,
  Role.CHACC,
  Role.HRMANAGER,
  Role.CEO,
]);

// Finance roles — can view and manage anomaly results and thresholds
const financeRoles = authMiddleware([
  Role.ADMIN,
  Role.ACCOUNT,
  Role.CHACC,
  Role.CEO,
  Role.PURCHASEMANAGER,
]);

// Document routes
router.post(
  "/upload",
  allRoles,
  uploadRateLimit,
  invoiceUploadMiddleware,
  documentController.uploadDocument,
);
router.get("/history", allRoles, documentController.getHistory);
router.get("/po-suggestions", allRoles, documentController.getPOSuggestions);
router.get(
  "/:id/status",
  allRoles,
  statusCheckRateLimit,
  documentController.getDocumentStatus,
);
router.get("/:id/result", allRoles, documentController.getDocumentResult);
router.post("/:id/confirm", allRoles, documentController.confirmDocument);
router.post("/check-duplicate", allRoles, documentController.checkDuplicate);

// ── Anomaly Detection routes ──────────────────────────────────────────────
// Must be registered BEFORE /:id routes to avoid param conflicts
router.get(
  "/anomalies/stats",
  financeRoles,
  anomalyController.getBranchAnomalyStats,
);
router.get(
  "/anomalies/config",
  financeRoles,
  anomalyController.getThresholdConfig,
);
router.put(
  "/anomalies/config",
  financeRoles,
  anomalyController.updateThresholdConfig,
);
router.get("/anomalies", financeRoles, anomalyController.getAnomalyResults);

// Matching routes
matchingRouter.post("/three-way", allRoles, documentController.threeWayMatch);
matchingRouter.get(
  "/:invoiceId",
  allRoles,
  documentController.getMatchingResult,
);

export { matchingRouter };
export default router;
