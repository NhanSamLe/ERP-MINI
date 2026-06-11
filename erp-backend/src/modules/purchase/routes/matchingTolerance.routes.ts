import { Router } from "express";
import { matchingToleranceController } from "../controllers/matchingTolerance.controller";
import { authMiddleware } from "../../../core/middleware/auth";
import { Role } from "../../../core/types/enum";

const router = Router();

router.get(
  "/",
  authMiddleware([Role.ACCOUNT, Role.CHACC]),
  matchingToleranceController.getAll
);
router.get(
  "/:id",
  authMiddleware([Role.ACCOUNT, Role.CHACC]),
  matchingToleranceController.getById
);
router.post(
  "/",
  authMiddleware([Role.CHACC]),
  matchingToleranceController.create
);
router.put(
  "/:id",
  authMiddleware([Role.CHACC]),
  matchingToleranceController.update
);
router.delete(
  "/:id",
  authMiddleware([Role.CHACC]),
  matchingToleranceController.delete
);

export default router;
