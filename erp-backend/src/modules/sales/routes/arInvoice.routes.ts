import { Router } from "express";
import { ArInvoiceController } from "../controllers/arInvoice.controller";
import { authMiddleware } from "../../../core/middleware/auth";

const router = Router();

// List invoice
router.get("/", authMiddleware([]), ArInvoiceController.getAll);
router.get("/available-orders",authMiddleware([]), ArInvoiceController.getAvailableOrders);
// Detail invoice
router.get("/:id", authMiddleware([]), ArInvoiceController.getOne);

// Create invoice
router.post("/", authMiddleware([]), ArInvoiceController.create);

// Update invoice (draft only)
router.put("/:id", authMiddleware([]), ArInvoiceController.update);

// Submit to chief accountant
router.post("/:id/submit", authMiddleware([]), ArInvoiceController.submit);

// Approve invoice
router.post("/:id/approve", authMiddleware(["CHACC"]), ArInvoiceController.approve);

// Reject invoice
router.post("/:id/reject", authMiddleware([]), ArInvoiceController.reject);



export default router;
