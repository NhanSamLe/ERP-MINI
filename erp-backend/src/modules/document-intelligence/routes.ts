import { Router } from "express";
import { documentController } from "./controllers/document.controller";
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

// Matching routes
matchingRouter.post("/three-way", allRoles, documentController.threeWayMatch);
matchingRouter.get(
  "/:invoiceId",
  allRoles,
  documentController.getMatchingResult,
);

export { matchingRouter };
export default router;
