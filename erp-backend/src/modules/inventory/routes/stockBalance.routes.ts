import { Router } from "express";
import { stockBalanceController } from "../controllers/stockBalance.controller";
import { authMiddleware } from "../../../core/middleware/auth";

const router = Router();

router.get("/", authMiddleware(["WHSTAFF"]), stockBalanceController.getAll);
router.get("/:id", authMiddleware(["WHSTAFF"]), stockBalanceController.getById);
router.get(
  "/warehouse/:warehouseId",
  authMiddleware(["WHSTAFF"]),
  stockBalanceController.findByWarehouse
);
router.get(
  "/product/:productId",
  authMiddleware(["WHSTAFF"]),
  stockBalanceController.findByProduct
);
export default router;
