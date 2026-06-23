import { Router } from "express";
import { purchaseOrderAuditController } from "../controllers/purchaseOrderAudit.controller";
import { authMiddleware } from "../../../core/middleware/auth";

const router = Router();

// Middleware
router.use(authMiddleware([]));

/**
 * GET /api/purchase-orders/:id/audit-logs
 * Lấy audit logs của một PO
 */
router.get("/:id/audit-logs", purchaseOrderAuditController.getAuditLogs);

/**
 * GET /api/purchase-orders/:id/audit-history
 * Lấy lịch sử thay đổi của một PO (dạng readable)
 */
router.get("/:id/audit-history", purchaseOrderAuditController.getAuditHistory);

export default router;
