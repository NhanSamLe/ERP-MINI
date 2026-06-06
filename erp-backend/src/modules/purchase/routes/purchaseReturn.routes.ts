import { Router } from "express";
import {
  praController,
  purchaseReturnController,
  apDebitNoteController,
  vendorRefundController,
} from "../controllers/purchaseReturn.controller";
import { authMiddleware } from "../../../core/middleware/auth";
import { Role } from "../../../core/types/enum";

const purchaseRoles = authMiddleware([
  Role.PURCHASE,
  Role.PURCHASEMANAGER,
  Role.ACCOUNT,
  Role.CHACC,
  Role.WHSTAFF,
  Role.WHMANAGER,
]);
const purchaseOnly = authMiddleware([Role.PURCHASE, Role.PURCHASEMANAGER]);
const accountRoles = authMiddleware([Role.ACCOUNT, Role.CHACC]);
const managerOnly = authMiddleware([Role.PURCHASEMANAGER, Role.CHACC]);

// ─── PRA Routes ────────────────────────────────────────────────────────────────
export const praRouter = Router();
praRouter.get("/", purchaseRoles, praController.getAll);
praRouter.get("/:id", purchaseRoles, praController.getById);
praRouter.post("/", purchaseOnly, praController.create);
praRouter.put("/:id", purchaseOnly, praController.update);
praRouter.post("/:id/submit", purchaseOnly, praController.submit);
praRouter.post("/:id/approve", managerOnly, praController.approve);
praRouter.post("/:id/reject", managerOnly, praController.reject);

// ─── Purchase Return Routes ────────────────────────────────────────────────────
export const purchaseReturnRouter = Router();
purchaseReturnRouter.get("/", purchaseRoles, purchaseReturnController.getAll);
purchaseReturnRouter.get(
  "/:id",
  purchaseRoles,
  purchaseReturnController.getById,
);
purchaseReturnRouter.post("/", purchaseOnly, purchaseReturnController.create);
purchaseReturnRouter.put("/:id", purchaseOnly, purchaseReturnController.update);
purchaseReturnRouter.post(
  "/:id/ship",
  purchaseOnly,
  purchaseReturnController.ship,
);
purchaseReturnRouter.post(
  "/:id/confirm",
  purchaseOnly,
  purchaseReturnController.confirm,
);
purchaseReturnRouter.post(
  "/:id/complete",
  purchaseOnly,
  purchaseReturnController.complete,
);

// ─── AP Debit Note Routes ──────────────────────────────────────────────────────
export const apDebitNoteRouter = Router();
apDebitNoteRouter.get("/", accountRoles, apDebitNoteController.getAll);
apDebitNoteRouter.get("/:id", accountRoles, apDebitNoteController.getById);
apDebitNoteRouter.post(
  "/from-return/:returnId",
  accountRoles,
  apDebitNoteController.createFromReturn,
);
apDebitNoteRouter.post("/:id/post", accountRoles, apDebitNoteController.post);
apDebitNoteRouter.post(
  "/:id/cancel",
  accountRoles,
  apDebitNoteController.cancel,
);

// ─── Vendor Refund Routes ──────────────────────────────────────────────────────
export const vendorRefundRouter = Router();
vendorRefundRouter.get("/", accountRoles, vendorRefundController.getAll);
vendorRefundRouter.get("/:id", accountRoles, vendorRefundController.getById);
vendorRefundRouter.post("/", accountRoles, vendorRefundController.create);
vendorRefundRouter.post("/:id/post", accountRoles, vendorRefundController.post);
