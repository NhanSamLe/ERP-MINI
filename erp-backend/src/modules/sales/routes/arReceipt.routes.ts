import { Router } from "express";
import { ArReceiptController } from "../controllers/arReceipt.controller";
import { authMiddleware } from "../../../core/middleware/auth";

const router = Router();

// List receipts
router.get("/", authMiddleware([]), ArReceiptController.getAll);

// Detail
router.get("/:id", authMiddleware([]), ArReceiptController.getOne);

// Create receipt
router.post("/", authMiddleware([]), ArReceiptController.create);

// Update (draft only)
router.put("/:id", authMiddleware([]), ArReceiptController.update);

// Submit to approve
router.post("/:id/submit", authMiddleware([]), ArReceiptController.submit);

// Approve receipt
router.post("/:id/approve", authMiddleware([]), ArReceiptController.approve);

// Reject receipt
router.post("/:id/reject", authMiddleware([]), ArReceiptController.reject);

// Allocate amount to invoices
router.post("/:id/allocate", authMiddleware([]), ArReceiptController.allocate);

export default router;
