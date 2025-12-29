import { Router } from "express";
import { WarehouseController } from "../controllers/warehouse.controller";
import { authMiddleware } from "../../../core/middleware/auth";
import { Role } from "../../../core/types/enum";

const router = Router();

router.get(
  "/",
  authMiddleware([Role.ADMIN, Role.WHSTAFF, Role.WHMANAGER]),
  WarehouseController.getAll
);
router.get(
  "/branch/:branchId",
  authMiddleware([Role.ADMIN, Role.WHSTAFF]),
  WarehouseController.getByBranch
);
router.get("/code/:code", WarehouseController.findByCode);
router.get("/:id", authMiddleware([Role.ADMIN]), WarehouseController.getById);
router.post("/", authMiddleware([Role.ADMIN]), WarehouseController.create);
router.put("/:id", authMiddleware([Role.ADMIN]), WarehouseController.update);
router.delete("/:id", authMiddleware([Role.ADMIN]), WarehouseController.delete);
export default router;
