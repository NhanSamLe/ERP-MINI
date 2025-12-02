import { Router } from "express";
import { WarehouseController } from "../controllers/warehouse.controller";
import { authMiddleware } from "../../../core/middleware/auth";
import { Role } from "../../../core/types/enum";

const router = Router();

router.get(
  "/",
  authMiddleware([Role.WHSTAFF, Role.WHMANAGER]),
  WarehouseController.getAll
);
router.get("/:id", authMiddleware([Role.WHSTAFF]), WarehouseController.getById);
router.get(
  "/branch/:branchId",
  authMiddleware([Role.WHSTAFF]),
  WarehouseController.getByBranch
);
router.get("/code/:code", WarehouseController.findByCode);
export default router;
