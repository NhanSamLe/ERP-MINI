import { Router } from "express";
import { physicalInventoryController } from "../controllers/physicalInventory.controller";
import { authMiddleware } from "../../../core/middleware/auth";
import { Role } from "../../../core/types/enum";

const router = Router();

const allRoles = authMiddleware([Role.ADMIN, Role.WHMANAGER, Role.WHSTAFF]);

const managerRoles = authMiddleware([Role.ADMIN, Role.WHMANAGER]);

router.get("/", allRoles, physicalInventoryController.getAll);
router.get("/:id", allRoles, physicalInventoryController.getById);
router.post("/", allRoles, physicalInventoryController.create);
router.post("/:id/start", allRoles, physicalInventoryController.start);
router.post("/:id/lines", allRoles, physicalInventoryController.addLine);
router.patch(
  "/:id/lines/:lineId",
  allRoles,
  physicalInventoryController.updateLine,
);
router.post(
  "/:id/validate",
  managerRoles,
  physicalInventoryController.validate,
);
router.post("/:id/cancel", allRoles, physicalInventoryController.cancel);

export default router;
