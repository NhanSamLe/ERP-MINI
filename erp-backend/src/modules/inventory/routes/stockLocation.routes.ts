import { Router } from "express";
import { stockLocationController } from "../controllers/stockLocation.controller";
import { authMiddleware } from "../../../core/middleware/auth";
import { Role } from "../../../core/types/enum";

const router = Router();

const allInventoryRoles = authMiddleware([
  Role.ADMIN,
  Role.WHMANAGER,
  Role.WHSTAFF,
]);
const managerRoles = authMiddleware([Role.ADMIN, Role.WHMANAGER]);

router.get("/tree", allInventoryRoles, stockLocationController.getTree);
router.get("/by-type", allInventoryRoles, stockLocationController.getByType);
router.get("/", allInventoryRoles, stockLocationController.getAll);
router.get("/:id", allInventoryRoles, stockLocationController.getById);
router.post("/", managerRoles, stockLocationController.create);
router.put("/:id", managerRoles, stockLocationController.update);
router.delete("/:id", managerRoles, stockLocationController.delete);

export default router;
