import { Router } from "express";
import { purchaseOrderController } from "../controllers/purchaseOrder.controller";
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
  purchaseOrderController.getAllPO
);
router.get(
  "/available-for-invoice",
  authMiddleware([Role.PURCHASE, Role.ACCOUNT]),
  purchaseOrderController.getAvailableForInvoice
);

router.get(
  "/by-status",
  authMiddleware([
    Role.PURCHASE,
    Role.WHSTAFF,
    Role.PURCHASEMANAGER,
    Role.WHMANAGER,
  ]),
  purchaseOrderController.getByStatus
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
  purchaseOrderController.getPOById
);

router.post(
  "/",
  authMiddleware([Role.PURCHASE]),
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "gallery", maxCount: 10 },
  ]),
  purchaseOrderController.create
);
router.put(
  "/:id",
  authMiddleware([Role.PURCHASE]),
  purchaseOrderController.update
);

router.patch(
  "/:id/submit",
  authMiddleware([Role.PURCHASE]),
  purchaseOrderController.submitForApproval
);

router.put(
  "/:id/approve",
  authMiddleware([Role.PURCHASEMANAGER]),
  purchaseOrderController.approvePO
);
router.put(
  "/:id/cancel",
  authMiddleware([Role.PURCHASEMANAGER]),
  purchaseOrderController.cancelPO
);

router.delete(
  "/:id",
  authMiddleware([Role.PURCHASE]),
  purchaseOrderController.deletedPO
);

export default router;
