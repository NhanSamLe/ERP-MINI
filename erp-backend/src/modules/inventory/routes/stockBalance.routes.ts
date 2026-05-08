import { Router } from "express";
import { stockBalanceController } from "../controllers/stockBalance.controller";
import { authMiddleware } from "../../../core/middleware/auth";
import { Role } from "../../../core/types/enum";

const router = Router();

router.get(
  "/",
  authMiddleware([Role.WHSTAFF, Role.WHMANAGER]),
  stockBalanceController.getAll,
);
router.get(
  "/grouped",
  authMiddleware([Role.WHSTAFF, Role.WHMANAGER]),
  stockBalanceController.getGrouped,
);
router.get(
  "/:id",
  authMiddleware([Role.WHSTAFF, Role.WHMANAGER]),
  stockBalanceController.getById,
);
router.get(
  "/warehouse/:warehouseId",
  authMiddleware([Role.WHSTAFF, Role.WHMANAGER]),
  stockBalanceController.findByWarehouse,
);
router.get(
  "/product/:productId",
  authMiddleware([Role.WHSTAFF, Role.WHMANAGER]),
  stockBalanceController.findByProduct,
);

router.post(
  "/recalculate-costs",
  authMiddleware([Role.ADMIN, Role.WHMANAGER]),
  stockBalanceController.recalculateCosts,
);

export default router;
