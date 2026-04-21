import { Router } from "express";
import { stockLotController } from "../controllers/stockLot.controller";
import { authMiddleware } from "../../../core/middleware/auth";
import { Role } from "../../../core/types/enum";

const router = Router();

const allRoles = authMiddleware([
  Role.ADMIN,
  Role.WHMANAGER,
  Role.WHSTAFF,
  Role.PURCHASE,
]);
const managerRoles = authMiddleware([Role.ADMIN, Role.WHMANAGER]);

// Specific routes before :id
router.get("/expiring", allRoles, stockLotController.getExpiring);
router.get("/", allRoles, stockLotController.getAll);
router.get("/:id", allRoles, stockLotController.getById);
router.post("/", allRoles, stockLotController.create);
router.put("/:id", allRoles, stockLotController.update);
router.delete("/:id", managerRoles, stockLotController.delete);

export default router;
