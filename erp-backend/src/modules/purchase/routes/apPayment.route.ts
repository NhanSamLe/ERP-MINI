import { Router } from "express";
import { apPaymentController } from "../controllers/apPayment.controller";
import { authMiddleware } from "../../../core/middleware/auth";
import { Role } from "../../../core/types/enum";

const router = Router();

router.get(
  "/",
  authMiddleware([Role.ACCOUNT, Role.CHACC]),
  apPaymentController.getAll
);

router.get(
  "/:id",
  authMiddleware([Role.ACCOUNT, Role.CHACC]),
  apPaymentController.getById
);

router.post("/", authMiddleware([Role.ACCOUNT]), apPaymentController.create);

router.post(
  "/:id/submit",
  authMiddleware([Role.ACCOUNT]),
  apPaymentController.submitForApproval
);

router.put(
  "/:id/approve",
  authMiddleware([Role.CHACC]),
  apPaymentController.approve
);

router.put(
  "/:id/reject",
  authMiddleware([Role.CHACC]),
  apPaymentController.reject
);

export default router;
