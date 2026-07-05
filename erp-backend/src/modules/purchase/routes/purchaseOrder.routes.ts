import { Router } from "express";
import { purchaseOrderController } from "../controllers/purchaseOrder.controller";
import { signatureController } from "../controllers/signature.controller";
import { authMiddleware } from "../../../core/middleware/auth";
import { upload } from "../../../core/middleware/upload";
import { Role } from "../../../core/types/enum";

const router = Router();

router.get(
  "/",
  authMiddleware([
    Role.PURCHASE,
    Role.PURCHASEMANAGER,
    Role.WHSTAFF,
    Role.WHMANAGER,
    Role.ACCOUNT,
  ]),
  purchaseOrderController.getAllPO,
);

/**
 * GET /api/purchase-orders/search
 * Tìm kiếm PO với các filter
 */
router.get(
  "/search",
  authMiddleware([
    Role.PURCHASE,
    Role.PURCHASEMANAGER,
    Role.WHSTAFF,
    Role.WHMANAGER,
    Role.ACCOUNT,
  ]),
  purchaseOrderController.search,
);

router.get(
  "/available-for-invoice",
  authMiddleware([Role.PURCHASE, Role.ACCOUNT]),
  purchaseOrderController.getAvailableForInvoice,
);

router.get(
  "/:id/invoice-summary",
  authMiddleware([Role.PURCHASE, Role.ACCOUNT]),
  purchaseOrderController.getPoInvoiceSummary,
);

router.get(
  "/by-status",
  authMiddleware([
    Role.PURCHASE,
    Role.WHSTAFF,
    Role.PURCHASEMANAGER,
    Role.WHMANAGER,
  ]),
  purchaseOrderController.getByStatus,
);
router.get(
  "/:id",
  authMiddleware([
    Role.PURCHASE,
    Role.PURCHASEMANAGER,
    Role.WHSTAFF,
    Role.WHMANAGER,
    Role.ACCOUNT,
  ]),
  purchaseOrderController.getPOById,
);

router.post(
  "/",
  authMiddleware([Role.PURCHASE]),
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "gallery", maxCount: 10 },
  ]),
  purchaseOrderController.create,
);
router.put(
  "/:id",
  authMiddleware([Role.PURCHASE]),
  purchaseOrderController.update,
);

router.patch(
  "/:id/submit",
  authMiddleware([Role.PURCHASE]),
  purchaseOrderController.submitForApproval,
);

router.put(
  "/:id/approve",
  authMiddleware([Role.PURCHASEMANAGER]),
  purchaseOrderController.approvePO,
);
router.post(
  "/:id/sign",
  authMiddleware([Role.PURCHASEMANAGER]),
  signatureController.signPurchaseOrder,
);
router.put(
  "/:id/cancel",
  authMiddleware([Role.PURCHASEMANAGER]),
  purchaseOrderController.cancelPO,
);

/**
 * POST /api/purchase-orders/bulk-approve
 * Phê duyệt hàng loạt PO
 */
router.post(
  "/bulk-approve",
  authMiddleware([Role.PURCHASEMANAGER]),
  purchaseOrderController.bulkApprove,
);

/**
 * POST /api/purchase-orders/bulk-cancel
 * Hủy hàng loạt PO
 */
router.post(
  "/bulk-cancel",
  authMiddleware([Role.PURCHASEMANAGER]),
  purchaseOrderController.bulkCancel,
);

router.delete(
  "/:id",
  authMiddleware([Role.PURCHASE]),
  purchaseOrderController.deletedPO,
);

router.post(
  "/:id/send-email",
  authMiddleware([Role.PURCHASE, Role.PURCHASEMANAGER]),
  purchaseOrderController.sendPOEmail,
);

export default router;
