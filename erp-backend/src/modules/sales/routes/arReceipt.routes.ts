import { Router } from "express";
import { ArReceiptController } from "../controllers/arReceipt.controller";
import { authMiddleware } from "../../../core/middleware/auth";

const router = Router();


// List receipts
router.get("/", authMiddleware([]), ArReceiptController.getAll);
router.get("/customer/:customer_id/unpaid", authMiddleware([]), ArReceiptController.getUnpaidInvoices);
router.get("/customers/debt", authMiddleware([]), ArReceiptController.getCustomersWithDebt);

// Detail
router.get("/:id", authMiddleware([]), ArReceiptController.getOne);

// Create receipt
router.post("/", authMiddleware(["ACCOUNT", "CHACC"]), ArReceiptController.create);

// Update (draft only)
router.put("/:id", authMiddleware(["ACCOUNT", "CHACC", "BRANCH_MANAGER", "BRMN"]), ArReceiptController.update);

// Submit to approve
router.post("/:id/submit", authMiddleware(["ACCOUNT", "CHACC"]), ArReceiptController.submit);

// Approve receipt
router.post("/:id/approve", authMiddleware(["CHACC"]), ArReceiptController.approve);

// Reject receipt
router.post("/:id/reject", authMiddleware(["CHACC"]), ArReceiptController.reject);

// Allocate amount to invoices
router.post("/:id/allocate", authMiddleware(["ACCOUNT", "CHACC"]), ArReceiptController.allocate);

export default router;
