import { Router } from "express";
import { purchaseOrderController } from "../controllers/purchaseOrder.controller";
import { authMiddleware } from "../../../core/middleware/auth";
import { upload } from "../../../core/middleware/upload";

const router = Router();

router.get("/", authMiddleware(["PURCHASE"]), purchaseOrderController.getAllPO);
router.get(
  "/:id",
  authMiddleware(["PURCHASE"]),
  purchaseOrderController.getPOById
);

router.post(
  "/",
  authMiddleware(["PURCHASE"]),
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "gallery", maxCount: 10 },
  ]),
  purchaseOrderController.create
);
router.put(
  "/:id",
  authMiddleware(["PURCHASE"]),
  purchaseOrderController.update
);

router.delete(
  "/:id",
  authMiddleware(["PURCHASE"]),
  purchaseOrderController.deletedPO
);

export default router;
