import { Router } from "express";
import { WarehouseController } from "../controllers/warehouse.controller";
import { authMiddleware } from "../../../core/middleware/auth";

const router = Router();

router.get("/", authMiddleware(["WHSTAFF"]), WarehouseController.getAll);
router.get("/:id", authMiddleware(["WHSTAFF"]), WarehouseController.getById);
router.get(
  "/branch/:branchId",
  authMiddleware(["WHSTAFF"]),
  WarehouseController.getByBranch
);
router.get("/code/:code", WarehouseController.findByCode);
export default router;
