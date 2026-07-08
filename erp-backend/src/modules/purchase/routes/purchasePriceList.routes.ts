import { Router } from "express";
import { purchasePriceListController } from "../controllers/purchasePriceList.controller";
import { authMiddleware } from "../../../core/middleware/auth";
import { Role } from "../../../core/types/enum";

const router = Router();

const purchaseRoles = authMiddleware([
  Role.PURCHASE,
  Role.PURCHASEMANAGER,
  Role.ACCOUNT,
  Role.CHACC,
]);
const managerOnly = authMiddleware([Role.PURCHASEMANAGER]);

// ─── Price lookup (phải đặt trước /:id để không bị match nhầm) ─────────────
router.get(
  "/evaluate-price",
  purchaseRoles,
  purchasePriceListController.evaluatePrice,
);

// ─── CRUD ──────────────────────────────────────────────────────────────────
router.get("/", purchaseRoles, purchasePriceListController.getAll);
router.get("/:id", purchaseRoles, purchasePriceListController.getById);
router.post("/", managerOnly, purchasePriceListController.create);
router.put("/:id", managerOnly, purchasePriceListController.update);
router.delete("/:id", managerOnly, purchasePriceListController.delete);

// ─── Items ─────────────────────────────────────────────────────────────────
router.post("/:id/items", purchaseRoles, purchasePriceListController.addItems);
router.put(
  "/:id/items/:itemId",
  purchaseRoles,
  purchasePriceListController.updateItem,
);
router.delete(
  "/:id/items/:itemId",
  managerOnly,
  purchasePriceListController.removeItem,
);

export default router;
