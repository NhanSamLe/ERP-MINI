import { Router } from "express";
import { rfqController } from "../controllers/rfq.controller";
import { authMiddleware } from "../../../core/middleware/auth";
import { Role } from "../../../core/types/enum";

const router = Router();

const purchaseRoles = authMiddleware([
  Role.PURCHASE,
  Role.PURCHASEMANAGER,
  Role.ACCOUNT,
]);
const purchaseOnly = authMiddleware([Role.PURCHASE]);
const managerOnly = authMiddleware([Role.PURCHASEMANAGER]);

// ─── READ ──────────────────────────────────────────────────────────────────
router.get("/", purchaseRoles, rfqController.getAll);
router.get("/compare", purchaseRoles, rfqController.compare);
router.get("/:id", purchaseRoles, rfqController.getById);

// ─── WRITE ─────────────────────────────────────────────────────────────────
router.post("/", purchaseOnly, rfqController.create);
router.put("/:id", purchaseOnly, rfqController.update);
router.delete("/:id", purchaseOnly, rfqController.delete);

// ─── STATUS TRANSITIONS ────────────────────────────────────────────────────
router.post("/:id/send", purchaseOnly, rfqController.send);
router.post("/:id/mark-received", purchaseOnly, rfqController.markReceived);
router.post("/:id/accept", purchaseOnly, rfqController.accept);
router.post("/:id/reject", purchaseOnly, rfqController.reject);
router.post("/:id/convert-to-po", purchaseOnly, rfqController.convertToPo);
router.post("/:id/new-version", purchaseOnly, rfqController.createNewVersion);

export default router;
