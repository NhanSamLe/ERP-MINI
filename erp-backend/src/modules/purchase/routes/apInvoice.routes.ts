import { Router } from "express";
import { apInvoiceController } from "../controllers/apInvoice.controller";
import { authMiddleware } from "../../../core/middleware/auth";
import { Role } from "../../../core/types/enum";

const router = Router();

const accountRoles = authMiddleware([Role.ACCOUNT, Role.CHACC]);
const accountOnly = authMiddleware([Role.ACCOUNT]);
const chaccOnly = authMiddleware([Role.CHACC]);

// ─── READ ──────────────────────────────────────────────────────────────────
// GET /api/ap/invoices?status=draft&source=ai_ocr
router.get("/", accountRoles, apInvoiceController.getAll);

// GET /api/ap/invoices/posted-summary?supplier_id=5
router.get(
  "/posted-summary",
  accountRoles,
  apInvoiceController.getPostedSummaryBySupplier,
);

// GET /api/ap/invoices/posted-suppliers
router.get(
  "/posted-suppliers",
  accountRoles,
  apInvoiceController.getPostedSuppliers,
);

// GET /api/ap/invoices/:id  — kèm matching_details + audit_trail
router.get("/:id", accountRoles, apInvoiceController.getById);

// ─── CREATE ────────────────────────────────────────────────────────────────
// POST /api/ap/invoices  — tạo thủ công (manual), không cần PO
router.post("/", accountOnly, apInvoiceController.createManual);

// POST /api/ap/invoices/from-po/:poId  — tạo từ PO (backward compatible)
router.post("/from-po/:poId", accountOnly, apInvoiceController.createFromPO);

// ─── APPROVAL WORKFLOW ─────────────────────────────────────────────────────
// POST /api/ap/invoices/:id/submit
router.post("/:id/submit", accountOnly, apInvoiceController.submitForApproval);

// PUT /api/ap/invoices/:id/approve
router.put("/:id/approve", chaccOnly, apInvoiceController.approve);

// PUT /api/ap/invoices/:id/reject
router.put("/:id/reject", chaccOnly, apInvoiceController.reject);

export default router;
