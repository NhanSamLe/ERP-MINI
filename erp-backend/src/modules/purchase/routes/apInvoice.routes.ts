import { Router } from "express";
import { apInvoiceController } from "../controllers/apInvoice.controller";
import { authMiddleware } from "../../../core/middleware/auth";
import { Role } from "../../../core/types/enum";

const router = Router();

router.get(
  "/",
  authMiddleware([Role.ACCOUNT, Role.CHACC]),
  apInvoiceController.getAll
);
router.get(
  "/:id",
  authMiddleware([Role.ACCOUNT, Role.CHACC]),
  apInvoiceController.getById
);

router.post(
  "/from-po/:poId",
  authMiddleware([Role.ACCOUNT]),
  apInvoiceController.createFromPO
);

export default router;
